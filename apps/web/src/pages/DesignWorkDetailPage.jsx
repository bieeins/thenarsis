import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { useParams, useNavigate } from 'react-router-dom';
import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button.jsx';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { 
  ArrowLeft, Calendar, MapPin, User, FileText, Link as LinkIcon, Image as ImageIcon, ExternalLink, Clock, AlertCircle, CheckCircle2, Copy, Activity, Users
} from 'lucide-react';
import pb from '@/lib/pocketbaseClient.js';
import { toast } from 'sonner';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

const DesignWorkDetailPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [work, setWork] = useState(null);
  const [crewList, setCrewList] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDetail = async () => {
      try {
        const record = await pb.collection('design_work').getOne(id, {
          expand: 'order_id,order_id.product_id,designer_id,assigned_by',
          $autoCancel: false
        });
        setWork(record);

        if (record.order_id) {
          const crewAssignments = await pb.collection('crew_assignments').getFullList({
            filter: `order_id="${record.order_id}"`,
            expand: 'crew_id',
            $autoCancel: false
          });
          const crews = crewAssignments.map(ca => ca.expand?.crew_id).filter(Boolean);
          setCrewList(crews);
        }

      } catch (err) {
        console.error('[DesignWorkDetailPage] Fetch error:', err);
        toast.error('Failed to load design work details.');
      } finally {
        setLoading(false);
      }
    };
    if (id) fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!work) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-muted/30">
        <div className="bg-card border rounded-2xl p-8 max-w-md w-full text-center shadow-sm">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-bold mb-2">Project Not Found</h2>
          <p className="text-muted-foreground mb-6">The design project you are looking for does not exist or you don't have access.</p>
          <Button onClick={() => navigate('/design-work-list')}>Return to List</Button>
        </div>
      </div>
    );
  }

  const order = work.expand?.order_id || {};
  const product = order.expand?.product_id || {};
  const designer = work.expand?.designer_id || {};
  const assignedBy = work.expand?.assigned_by?.name || 'System';
  const linkInfo = validateAndFormatDesignLink(work.design_file_link);
  const eventDate = order.event_date ? parseISO(order.event_date) : null;

  const getStatusBadge = (status) => {
    const s = status || 'pending';
    switch(s.toLowerCase()) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800 text-sm px-3 py-1">Pending</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800 text-sm px-3 py-1">In Progress</Badge>;
      case 'revision': return <Badge className="bg-purple-100 text-purple-800 text-sm px-3 py-1">Revision Required</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-800 text-sm px-3 py-1">Completed</Badge>;
      default: return <Badge variant="outline" className="text-sm px-3 py-1">{s}</Badge>;
    }
  };

  const handleCopyLink = () => {
    if (linkInfo.url) {
      navigator.clipboard.writeText(linkInfo.url);
      toast.success('Link copied to clipboard');
    }
  };

  const handleTestLink = () => {
    if (linkInfo.status === 'valid') {
      toast.success('Valid URL format detected');
    } else if (linkInfo.status === 'invalid') {
      toast.error(`Invalid URL: ${linkInfo.error}`);
    } else {
      toast.error('No link provided to test');
    }
  };

  return (
    <>
      <Helmet>
        <title>Review Design: {order.event_name} - Thenarsis</title>
      </Helmet>

      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
          <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 -ml-4 hover:bg-transparent">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
            <div>
              <h1 className="text-3xl font-extrabold tracking-tight text-foreground mb-2">
                {order.event_name || 'Unnamed Event'}
              </h1>
              <div className="flex items-center gap-3 text-muted-foreground">
                <span className="flex items-center gap-1.5"><User className="w-4 h-4" /> {order.customer_name}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-border"></span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" /> {eventDate ? format(eventDate, 'MMMM dd, yyyy') : 'No Date'}</span>
              </div>
            </div>
            <div className="shrink-0">
              {getStatusBadge(work.status)}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              
              <Card className="border-0 shadow-lg overflow-hidden">
                <CardHeader className="bg-card border-b pb-4">
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-primary" /> Design Assets
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      {linkInfo.status === 'valid' && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Valid Link</Badge>}
                      {linkInfo.status === 'invalid' && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10"><AlertCircle className="w-3 h-3 mr-1"/> Invalid Link</Badge>}
                      {linkInfo.status === 'missing' && <Badge variant="secondary" className="text-muted-foreground">Missing Link</Badge>}
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="p-0">
                  {linkInfo.status === 'valid' ? (
                    <div className="flex flex-col">
                      {linkInfo.isImage && (
                        <div className="bg-muted p-6 flex items-center justify-center min-h-[300px] border-b">
                          <img src={linkInfo.url} alt="Design Render" className="max-h-[600px] w-full object-contain rounded shadow-sm border bg-background" />
                        </div>
                      )}
                      <div className="p-6 bg-card flex flex-col sm:flex-row items-center justify-between gap-4">
                        <div className="flex items-center gap-3 min-w-0 w-full">
                          <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                            {linkInfo.isImage ? <ImageIcon className="w-6 h-6" /> : <LinkIcon className="w-6 h-6" />}
                          </div>
                          <div className="truncate">
                            <p className="font-semibold text-base">Source File URL</p>
                            <a 
                              href={linkInfo.url} 
                              target="_blank" 
                              rel="noopener noreferrer"
                              className="text-sm text-primary truncate hover:underline block"
                            >
                              {linkInfo.url}
                            </a>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full sm:w-auto shrink-0">
                          <Button variant="outline" size="sm" onClick={handleTestLink}>
                            <Activity className="w-4 h-4 mr-2" /> Test
                          </Button>
                          <Button variant="outline" size="sm" onClick={handleCopyLink}>
                            <Copy className="w-4 h-4 mr-2" /> Copy
                          </Button>
                          <Button asChild size="sm">
                            <a href={linkInfo.url} target="_blank" rel="noopener noreferrer">
                              <ExternalLink className="w-4 h-4 mr-2" /> Open
                            </a>
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="p-12 text-center flex flex-col items-center bg-muted/10">
                      <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
                        {linkInfo.status === 'invalid' ? <AlertCircle className="w-8 h-8 text-destructive/50" /> : <LinkIcon className="w-8 h-8 text-muted-foreground/50" />}
                      </div>
                      <h3 className="font-bold text-lg mb-1">
                        {linkInfo.status === 'invalid' ? 'Invalid Link Format' : 'No Valid Asset Provided'}
                      </h3>
                      <p className="text-muted-foreground text-sm max-w-sm">
                        {linkInfo.status === 'invalid' ? 'The provided link is not a valid URL.' : 'The designer has not uploaded a valid link for this project yet.'}
                      </p>
                      {work.design_file_link && (
                        <div className="mt-4 p-3 bg-destructive/10 border border-destructive/20 rounded text-destructive text-sm truncate max-w-full flex items-center gap-2">
                          <span className="truncate">Raw value: {work.design_file_link}</span>
                          <Button size="sm" variant="ghost" className="h-6 px-2 shrink-0" onClick={handleTestLink}>Test</Button>
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-base">Designer Notes</CardTitle>
                </CardHeader>
                <CardContent>
                  {work.design_notes ? (
                    <div className="p-4 bg-muted/30 rounded-xl text-sm leading-relaxed whitespace-pre-wrap">
                      {work.design_notes}
                    </div>
                  ) : (
                    <p className="text-muted-foreground text-sm italic">No notes provided by the designer.</p>
                  )}
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2"><User className="w-4 h-4 text-primary" /> Team Assignment</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-6">
                  
                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Lead Designer</h4>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                        {(designer.name || 'U')[0].toUpperCase()}
                      </div>
                      <div>
                        <p className="font-bold text-foreground">{designer.name || 'Unassigned'}</p>
                        <p className="text-xs text-muted-foreground">{designer.email || 'No email'}</p>
                      </div>
                    </div>
                  </div>

                  <Separator />

                  <div>
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">Event Crew</h4>
                    {crewList.length > 0 ? (
                      <div className="space-y-3">
                        {crewList.map(crew => (
                          <div key={crew.id} className="flex items-center gap-3">
                            <div className="w-8 h-8 bg-muted rounded-full flex items-center justify-center text-muted-foreground font-bold text-xs">
                              {crew.name ? crew.name[0].toUpperCase() : 'U'}
                            </div>
                            <div>
                              <p className="font-medium text-sm text-foreground">{crew.name}</p>
                              <p className="text-xs text-muted-foreground capitalize">{crew.role}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 text-muted-foreground text-sm bg-muted/30 p-3 rounded-lg border border-dashed">
                        <Users className="w-4 h-4 opacity-50" />
                        <span className="italic">No crew assigned</span>
                      </div>
                    )}
                  </div>
                  
                </CardContent>
              </Card>

              <Card className="border-0 shadow-sm">
                <CardHeader className="pb-3 border-b">
                  <CardTitle className="text-base flex items-center gap-2"><MapPin className="w-4 h-4 text-primary" /> Event Context</CardTitle>
                </CardHeader>
                <CardContent className="pt-5 space-y-4">
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Package</p>
                    <p className="text-sm font-medium">{product.package_name || 'Custom Package'}</p>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Location</p>
                    <p className="text-sm font-medium">{order.event_location || '-'}</p>
                  </div>
                  <Separator />
                  <div className="space-y-1">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Assignment Info</p>
                    <div className="text-sm mt-1 space-y-1 text-muted-foreground">
                      <p className="flex items-center gap-2"><User className="w-3.5 h-3.5" /> By {assignedBy}</p>
                      <p className="flex items-center gap-2"><Clock className="w-3.5 h-3.5" /> {work.assigned_date ? format(new Date(work.assigned_date), 'MMM dd, yyyy') : '-'}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

        </div>
      </div>
    </>
  );
};

export default DesignWorkDetailPage;