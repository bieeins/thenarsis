import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { ArrowLeft, Calendar, MapPin, User, Phone, Package, FileText, CheckCircle2, Loader2, Link as LinkIcon, ExternalLink, Image as ImageIcon, Users } from 'lucide-react';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Checkbox } from '@/components/ui/checkbox.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { toast } from 'sonner';
import NotesSection from '@/components/NotesSection.jsx';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { designWorkService } from '@/services/designWorkService.js';
import { useAuth } from '@/contexts/AuthContext.jsx';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

const CrewEventDetailPage = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [assignment, setAssignment] = useState(null);
  const [designWork, setDesignWork] = useState(null);
  const [teamAssignments, setTeamAssignments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [confirming, setConfirming] = useState(false);
  const [isAttending, setIsAttending] = useState(false);

  useEffect(() => {
    if (currentUser) {
      fetchEventDetails();
    }
  }, [eventId, currentUser]);

  const fetchEventDetails = async () => {
    try {
      setLoading(true);
      let record = null;

      // Try fetching as assignment ID first
      try {
        record = await crewAssignmentService.get(eventId).then((res) => res.data);
      } catch (err) {
        // Fallback: If not found, try to search crew_assignments by order_id and crew_id
        if (currentUser?.id) {
          try {
            const matches = await crewAssignmentService.list({ orderId: eventId, crewId: currentUser.id });
            record = matches.data?.[0] || null;
          } catch (innerErr) {
            console.error('Fallback lookup failed:', innerErr);
          }
        }
      }

      if (!record) {
        throw new Error('Assignment not found');
      }

      setAssignment(record);
      setIsAttending(record.attendance_confirmation || false);

      // Fetch related design work
      if (record.order?.id) {
        try {
          const dWorkRes = await designWorkService.list({ orderId: record.order.id });
          setDesignWork(dWorkRes.data?.[0] || null);
        } catch (dwErr) {
          console.log('No design work record found for this order:', dwErr);
          setDesignWork(null);
        }

        // Who else is assigned to this same event — so a crew member knows
        // when they're one of several people covering it.
        try {
          const teamRes = await crewAssignmentService.list({ orderId: record.order.id });
          setTeamAssignments(teamRes.data || []);
        } catch (teamErr) {
          setTeamAssignments([]);
        }
      }
    } catch (error) {
      console.error('Error fetching event details:', error);
      toast.error('Failed to load event details');
      navigate('/crew-calendar');
    } finally {
      setLoading(false);
    }
  };

  const handleAttendanceConfirm = async () => {
    try {
      setConfirming(true);
      // Always update by the resolved assignment's own id, never the route
      // param: when navigating here via an order id shared by multiple crew
      // (e.g. from the dashboard's assigned-events list), using that id
      // directly would target the wrong crew_assignment record.
      await crewAssignmentService.update(assignment.id, {
        attendance_confirmation: isAttending,
        attendance_status: isAttending ? 'confirmed' : 'pending'
      });

      toast.success('Attendance status updated');
      fetchEventDetails();
    } catch (error) {
      console.error('Error updating attendance:', error);
      toast.error('Failed to update attendance');
    } finally {
      setConfirming(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/30 py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-6">
          <Skeleton className="h-10 w-32" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!assignment || !assignment.order) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold mb-2">Event Not Found</h2>
          <Button onClick={() => navigate('/crew-calendar')}>Back to Calendar</Button>
        </div>
      </div>
    );
  }

  const order = assignment.order;
  const product = order.product;

  return (
    <>
      <Helmet>
        <title>{order.event_name} - Event Details</title>
      </Helmet>
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 text-muted-foreground hover:text-foreground">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight">{order.event_name}</h1>
              <div className="flex items-center gap-3 mt-2 text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="w-4 h-4" /> {format(parseISO(order.event_date), 'PPP')}</span>
                <span className="flex items-center gap-1"><MapPin className="w-4 h-4" /> {order.event_location}</span>
              </div>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-semibold ${
              assignment.attendance_status === 'confirmed' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400' :
              assignment.attendance_status === 'completed' ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400' :
              'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
            }`}>
              {assignment.attendance_status?.toUpperCase() || 'PENDING'}
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="md:col-span-2 shadow-sm border-border/60">
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Event Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><User className="w-4 h-4" /> Customer</p>
                    <p className="font-medium">{order.customer_name}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Phone className="w-4 h-4" /> Contact</p>
                    <p className="font-medium">{order.phone_number}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Package className="w-4 h-4" /> Package</p>
                    <p className="font-medium">{product?.package_name || 'Custom Package'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><Users className="w-4 h-4" /> Crew Assigned</p>
                    <p className="font-medium">
                      {teamAssignments.length > 0
                        ? teamAssignments.map((m) => m.crew?.name || 'Unknown').join(', ')
                        : 'You'}
                    </p>
                  </div>
                </div>

                {order.description && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Description</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none" dangerouslySetInnerHTML={{ __html: order.description }} />
                  </div>
                )}
                
                {order.designer_notes && (
                  <div className="pt-4 border-t">
                    <p className="text-sm text-muted-foreground mb-2">Designer Notes</p>
                    <div className="prose prose-sm dark:prose-invert max-w-none bg-muted/50 p-4 rounded-lg" dangerouslySetInnerHTML={{ __html: order.designer_notes }} />
                  </div>
                )}
              </CardContent>
            </Card>

            <div className="space-y-6">
              <Card className="shadow-sm border-border/60 bg-primary/5 border-primary/20">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-primary" /> Attendance
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-muted-foreground">Please confirm your attendance for this event.</p>
                  <div className="flex items-center space-x-2 bg-background p-3 rounded-lg border">
                    <Checkbox 
                      id="attendance" 
                      checked={isAttending}
                      onCheckedChange={setIsAttending}
                    />
                    <label
                      htmlFor="attendance"
                      className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                    >
                      I confirm I will attend (Hadir)
                    </label>
                  </div>
                  <Button 
                    className="w-full" 
                    onClick={handleAttendanceConfirm}
                    disabled={confirming || isAttending === assignment.attendance_confirmation}
                  >
                    {confirming ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                    Update Status
                  </Button>
                </CardContent>
              </Card>

              {teamAssignments.length > 1 && (
                <Card className="shadow-sm border-border/60">
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Users className="w-5 h-5 text-primary" /> Crew on This Event
                    </CardTitle>
                    <CardDescription>{teamAssignments.length} crew members are assigned to this event</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {teamAssignments.map((member) => (
                      <div key={member.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg border">
                        <span className="font-medium text-sm">
                          {member.crew?.name || 'Unknown'}
                          {member.crew_id === currentUser?.id && <span className="text-muted-foreground font-normal"> (You)</span>}
                        </span>
                        <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                          member.attendance_status === 'confirmed' || member.attendance_status === 'completed' || member.attendance_status === 'hadir'
                            ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400'
                            : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                        }`}>
                          {(member.attendance_status || 'pending').replace('_', ' ').toUpperCase()}
                        </span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}

              {/* Design Assets Card */}
              <Card className="shadow-sm border-border/60">
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <LinkIcon className="w-5 h-5 text-[#FBBF24]" /> Design Assets
                  </CardTitle>
                  <CardDescription>Reference links provided by the design team</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {!designWork ? (
                    <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed text-sm">
                      <p className="text-muted-foreground">No designer assigned or started work yet.</p>
                    </div>
                  ) : !designWork.design_file_link ? (
                    <div className="text-center py-6 bg-muted/20 rounded-xl border border-dashed text-sm">
                      <p className="text-muted-foreground">No design link provided yet (Status: {designWork.status?.replace('_', ' ')}).</p>
                    </div>
                  ) : (
                    <div className="space-y-4 text-sm">
                      {designWork.design_notes && (
                        <div className="p-3 bg-muted/50 rounded-lg border text-xs">
                          <p className="font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-3.5 h-3.5" /> Designer Notes:</p>
                          <p className="text-muted-foreground">{designWork.design_notes}</p>
                        </div>
                      )}
                      
                      {(() => {
                        const linkInfo = validateAndFormatDesignLink(designWork.design_file_link);
                        if (linkInfo.isValid) {
                          return (
                            <div className="border rounded-xl overflow-hidden bg-card shadow-sm">
                              <div className="p-3 flex flex-col gap-2">
                                <div className="flex items-center gap-2 overflow-hidden">
                                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                    {linkInfo.isImage ? <ImageIcon className="w-4 h-4" /> : <LinkIcon className="w-4 h-4" />}
                                  </div>
                                  <div className="truncate min-w-0">
                                    <p className="font-semibold text-xs">Project Files</p>
                                    <p className="text-[10px] text-muted-foreground truncate">{linkInfo.url}</p>
                                  </div>
                                </div>
                                <Button className="w-full text-xs" size="sm" asChild>
                                  <a href={linkInfo.url} target="_blank" rel="noopener noreferrer">
                                    Open Design <ExternalLink className="w-3.5 h-3.5 ml-1" />
                                  </a>
                                </Button>
                              </div>
                              
                              {linkInfo.isImage && (
                                <div className="bg-muted p-2 flex justify-center border-t">
                                  <img src={linkInfo.url} alt="Design Preview" className="max-h-[180px] object-contain rounded border shadow-sm" />
                                </div>
                              )}
                            </div>
                          );
                        } else {
                          return (
                            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-2 text-xs">
                              <LinkIcon className="w-4 h-4 text-destructive" />
                              <div>
                                <p className="font-semibold text-destructive">Invalid Link Provided</p>
                                <p className="text-muted-foreground text-[10px] truncate">{designWork.design_file_link}</p>
                              </div>
                            </div>
                          );
                        }
                      })()}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>

          <Card className="shadow-sm border-border/60">
            <CardContent className="p-6">
              <NotesSection orderId={order.id} />
            </CardContent>
          </Card>

        </div>
      </div>
    </>
  );
};

export default CrewEventDetailPage;