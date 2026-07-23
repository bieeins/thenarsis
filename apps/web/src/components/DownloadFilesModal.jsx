import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, Download, File, User, Calendar, AlertCircle, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import { designWorkService } from '@/services/designWorkService.js';

// NOTE: design_work.design_file (file uploads) was removed from the schema —
// only design_work.design_file_link (a plain text URL) survives, so this modal
// now lists project links rather than individual file downloads.
const DownloadFilesModal = ({ isOpen, onClose, orderId }) => {
  const [links, setLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchFiles();
    } else if (!isOpen) {
      setLinks([]);
      setError(false);
    }
  }, [isOpen, orderId]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(false);
    try {
      const designWorks = await designWorkService.listAll({ orderId });

      const extractedLinks = (designWorks || [])
        .filter((dw) => !!dw.design_file_link)
        .map((dw) => ({
          id: dw.id,
          url: dw.design_file_link,
          uploadDate: dw.updated_at,
          designerName: dw.designer?.name || 'Unknown Designer',
        }));

      setLinks(extractedLinks);
    } catch (err) {
      console.error('Failed to fetch files', err);
      setError(true);
      toast.error('Failed to load design files');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[550px] max-h-[85vh] flex flex-col p-0 overflow-hidden bg-card border border-border rounded-2xl shadow-xl">
        <DialogHeader className="p-6 border-b border-border/50 bg-slate-50 dark:bg-slate-900/50 shrink-0">
          <DialogTitle className="text-xl font-bold flex items-center gap-2">
            <div className="p-2 bg-[hsl(var(--accent-yellow))]/20 rounded-lg">
              <Download className="w-5 h-5 text-[hsl(var(--accent-yellow-active))]" />
            </div>
            Project Files
          </DialogTitle>
          <DialogDescription className="mt-2 text-muted-foreground">
            Open available design asset links and documentation for this event.
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-muted/10">
          {loading ? (
            <div className="py-12 flex flex-col items-center justify-center text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-4 text-[hsl(var(--accent-yellow))]" />
              <p>Locating files...</p>
            </div>
          ) : error ? (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <AlertCircle className="w-12 h-12 text-destructive mb-4" />
              <p className="font-medium mb-2">Failed to load files</p>
              <Button variant="outline" size="sm" onClick={fetchFiles}>Retry</Button>
            </div>
          ) : links.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-background rounded-xl border border-dashed border-border/60">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">No files available yet</h4>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                The designer hasn't shared any final asset links for this event yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {links.map((link) => (
                <div key={link.id} className="group p-4 bg-card border border-border/60 rounded-xl shadow-sm hover:border-[hsl(var(--accent-yellow))] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-[hsl(var(--accent-yellow))]/10 rounded-lg text-[hsl(var(--accent-yellow-active))] shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate" title={link.url}>
                        {link.url}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {link.designerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {link.uploadDate ? format(new Date(link.uploadDate), 'MMM d, yyyy') : 'Unknown'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    asChild
                    className="shrink-0 shadow-sm bg-[hsl(var(--accent-yellow))] hover:bg-[hsl(var(--accent-yellow-hover))] text-black font-semibold w-full sm:w-auto"
                  >
                    <a href={link.url} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" /> Open
                    </a>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default DownloadFilesModal;
