import React from 'react';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { Badge } from '@/components/ui/badge.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Separator } from '@/components/ui/separator.jsx';
import { Calendar, MapPin, User, Clock, Link as LinkIcon, ExternalLink, Copy, CheckCircle2, AlertCircle, Users } from 'lucide-react';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';
import { toast } from 'sonner';

const CalendarEventModal = ({ isOpen, onClose, event }) => {
  if (!event) return null;

  const eventDate = event.event_date ? parseISO(event.event_date) : null;
  const linkInfo = validateAndFormatDesignLink(event.design_file_link);

  const getStatusBadge = (status) => {
    const s = status || 'pending';
    switch(s.toLowerCase()) {
      case 'pending': return <Badge className="bg-amber-100 text-amber-800">Pending</Badge>;
      case 'in_progress': return <Badge className="bg-blue-100 text-blue-800">In Progress</Badge>;
      case 'revision': return <Badge className="bg-purple-100 text-purple-800">Revision</Badge>;
      case 'completed': return <Badge className="bg-emerald-100 text-emerald-800">Completed</Badge>;
      default: return <Badge variant="outline">{s}</Badge>;
    }
  };

  const handleCopyLink = () => {
    if (linkInfo.url) {
      navigator.clipboard.writeText(linkInfo.url);
      toast.success('Link copied to clipboard');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <div className="flex justify-between items-start pr-6">
            <DialogTitle className="text-xl font-bold">{event.event_name || 'Unnamed Event'}</DialogTitle>
            {getStatusBadge(event.status)}
          </div>
          <DialogDescription>
            Design Work Details & Crew Assignments
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          <div className="space-y-3 text-sm">
            <div className="flex items-center gap-3 text-muted-foreground">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="font-medium text-foreground">
                {eventDate ? format(eventDate, 'EEEE, MMMM dd, yyyy') : 'No Date Set'}
              </span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <User className="w-4 h-4 text-primary" />
              <span>Client: <span className="font-medium text-foreground">{event.customer_name || 'Unknown'}</span></span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Location: <span className="font-medium text-foreground">{event.event_location || 'TBD'}</span></span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Clock className="w-4 h-4 text-primary" />
              <span>Designer: <span className="font-medium text-foreground">{event.designer_name || 'Unassigned'}</span></span>
            </div>
            <div className="flex items-center gap-3 text-muted-foreground">
              <Users className="w-4 h-4 text-primary" />
              <span>Crew: <span className="font-medium text-foreground">{event.crew_names || 'Unassigned'}</span></span>
            </div>
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="font-semibold text-sm flex items-center gap-2">
              <LinkIcon className="w-4 h-4" /> Design Asset Link
            </h4>
            
            <div className="bg-muted/30 p-4 rounded-xl border">
              <div className="flex items-center gap-2 mb-3">
                {linkInfo.status === 'valid' && <Badge className="bg-emerald-100 text-emerald-800 hover:bg-emerald-100"><CheckCircle2 className="w-3 h-3 mr-1"/> Valid Link</Badge>}
                {linkInfo.status === 'invalid' && <Badge className="bg-destructive/10 text-destructive hover:bg-destructive/10"><AlertCircle className="w-3 h-3 mr-1"/> Invalid Link</Badge>}
                {linkInfo.status === 'missing' && <Badge variant="secondary" className="text-muted-foreground">No Link Provided</Badge>}
              </div>

              {linkInfo.status === 'valid' ? (
                <div className="space-y-3">
                  <a 
                    href={linkInfo.url} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-sm text-primary hover:underline break-all block"
                  >
                    {linkInfo.url}
                  </a>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={handleCopyLink} variant="outline" className="flex-1">
                      <Copy className="w-4 h-4 mr-2" /> Copy
                    </Button>
                    <Button size="sm" asChild className="flex-1">
                      <a href={linkInfo.url} target="_blank" rel="noopener noreferrer">
                        Open <ExternalLink className="w-4 h-4 ml-2" />
                      </a>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  {linkInfo.status === 'invalid' ? `Invalid format: ${event.design_file_link}` : 'The designer has not uploaded a link yet.'}
                </div>
              )}
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default CalendarEventModal;