import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button.jsx';
import { Label } from '@/components/ui/label.jsx';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { ArrowLeft, Calendar, MapPin, User, FileText, Wallet, CheckCircle2, Link as LinkIcon, ExternalLink, Image as ImageIcon } from 'lucide-react';
import { toast } from 'sonner';
import { crewAssignmentService } from '@/services/crewAssignmentService.js';
import { designWorkService } from '@/services/designWorkService.js';
import { format } from 'date-fns';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

const EventDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assignment, setAssignment] = useState(null);
  const [designWork, setDesignWork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadEventDetail();
  }, [id]);

  const loadEventDetail = async () => {
    try {
      const res = await crewAssignmentService.get(id);
      const record = res.data;
      setAssignment(record);

      if (record.order_id) {
        const dWorkRes = await designWorkService.list({ orderId: record.order_id }).catch(() => null);
        setDesignWork(dWorkRes?.data?.[0] || null);
      }
    } catch (error) {
      toast.error('Failed to load event details');
      navigate('/crew/my-events');
    } finally {
      setLoading(false);
    }
  };

  if (loading || !assignment) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const order = assignment.order;
  const product = order?.product;
  const designLinkInfo = designWork?.design_file_link ? validateAndFormatDesignLink(designWork.design_file_link) : null;

  return (
    <>
      <Helmet>
        <title>Event Detail: {order?.event_name} - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => navigate('/crew/my-events')} className="mb-6 -ml-4 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Schedule
          </Button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="bg-secondary text-secondary-foreground rounded-t-xl pb-4">
                  <CardTitle>Event Information</CardTitle>
                </CardHeader>
                <CardContent className="pt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="space-y-4 text-sm">
                      <div>
                        <p className="text-muted-foreground mb-1 text-xs uppercase tracking-wider">Event Name</p>
                        <p className="font-semibold text-lg">{order?.event_name}</p>
                      </div>
                      
                      <div className="flex gap-3">
                        <Calendar className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Date</p>
                          <p className="font-medium">{order?.event_date ? format(new Date(order.event_date), 'EEEE, MMMM dd, yyyy') : '-'}</p>
                        </div>
                      </div>

                      <div className="flex gap-3">
                        <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Location</p>
                          <p className="font-medium">{order?.event_location}</p>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4 text-sm bg-muted/30 p-4 rounded-xl">
                      <div className="flex gap-3">
                        <User className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Customer</p>
                          <p className="font-medium">{order?.customer_name}</p>
                          <p className="text-muted-foreground">{order?.phone_number}</p>
                        </div>
                      </div>

                      <Separator />

                      <div className="flex gap-3">
                        <FileText className="w-4 h-4 text-muted-foreground mt-0.5" />
                        <div>
                          <p className="text-muted-foreground text-xs uppercase">Package Booked</p>
                          <p className="font-medium">{product?.package_name || 'Custom Package'}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Design Assets Section */}
              <Card className="border-0 shadow-md">
                <CardHeader>
                  <CardTitle className="text-lg">Design Assets</CardTitle>
                  <CardDescription>Reference links provided by the design team</CardDescription>
                </CardHeader>
                <CardContent>
                  {!designWork ? (
                    <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                      <p className="text-muted-foreground">Designer has not been assigned or started work on this event yet.</p>
                    </div>
                  ) : !designWork.design_file_link ? (
                    <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                      <p className="text-muted-foreground">No design link provided yet (Status: {designWork.status.replace('_', ' ')})</p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {designWork.design_notes && (
                        <div className="p-4 bg-primary/5 rounded-xl border border-primary/20 text-sm">
                          <p className="font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Designer Notes:</p>
                          <p className="text-muted-foreground">{designWork.design_notes}</p>
                        </div>
                      )}
                      
                      {designLinkInfo?.isValid ? (
                        <div className="bg-card border rounded-xl overflow-hidden shadow-sm">
                          <div className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b">
                            <div className="flex items-center gap-3 overflow-hidden">
                              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                                {designLinkInfo.isImage ? <ImageIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                              </div>
                              <div className="truncate min-w-0">
                                <p className="font-semibold text-sm">Project Files</p>
                                <p className="text-xs text-muted-foreground truncate">{designLinkInfo.url}</p>
                              </div>
                            </div>
                            <Button className="shrink-0" asChild>
                              <a href={designLinkInfo.url} target="_blank" rel="noopener noreferrer">
                                Open Design <ExternalLink className="w-4 h-4 ml-2" />
                              </a>
                            </Button>
                          </div>
                          
                          {designLinkInfo.isImage && (
                            <div className="bg-muted p-4 flex justify-center">
                              <img src={designLinkInfo.url} alt="Design Preview" className="max-h-[300px] object-contain rounded border shadow-sm" />
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="p-4 bg-destructive/10 border border-destructive/20 rounded-xl flex items-center gap-3">
                          <LinkIcon className="w-5 h-5 text-destructive" />
                          <div>
                            <p className="font-semibold text-sm text-destructive">Invalid Link Provided</p>
                            <p className="text-xs text-destructive/80 truncate">{designWork.design_file_link}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="lg:col-span-1 space-y-6">
              <Card className="border-0 shadow-lg">
                <CardHeader className="border-b border-border pb-4">
                  <CardTitle>Crew Assignment</CardTitle>
                </CardHeader>
                <CardContent className="pt-6 space-y-6">
                  <div className="space-y-2">
                    <Label className="text-muted-foreground text-xs uppercase">Your Payment Status</Label>
                    <div className="flex items-center gap-2">
                      <span className={`px-3 py-1 text-sm font-semibold rounded-full uppercase ${assignment.status === 'pending' ? 'bg-amber-100 text-amber-800' : 'bg-green-100 text-green-800'}`}>
                        {assignment.status}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 bg-secondary text-secondary-foreground rounded-xl space-y-3">
                    <div className="flex items-center gap-2 opacity-80 text-sm">
                      <Wallet className="w-4 h-4" /> Crew Fee Structure
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                      <span>Agreed Fee</span>
                      <span className="font-semibold font-numeric">Rp {Math.round(assignment.attendance_amount || assignment.fee || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm border-b border-white/10 pb-2">
                      <span className="text-green-400">Paid Amount</span>
                      <span className="font-semibold text-green-400 font-numeric">Rp {Math.round(assignment.paid_amount || 0).toLocaleString('id-ID')}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-primary">Pending Amount</span>
                      <span className="font-bold text-primary font-numeric">Rp {Math.round(assignment.pending_amount || 0).toLocaleString('id-ID')}</span>
                    </div>
                  </div>
                  
                  {assignment.status === 'completed' && (
                    <div className="flex items-center gap-2 text-green-600 bg-green-50 p-3 rounded-lg text-sm font-medium border border-green-100">
                      <CheckCircle2 className="w-4 h-4" />
                      Assignment fully paid.
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default EventDetail;