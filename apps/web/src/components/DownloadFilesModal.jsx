import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Loader2, Download, File, User, Calendar, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import pb from '@/lib/pocketbaseClient.js';

const DownloadFilesModal = ({ isOpen, onClose, orderId }) => {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);

  useEffect(() => {
    if (isOpen && orderId) {
      fetchFiles();
    } else if (!isOpen) {
      setFiles([]);
      setError(false);
    }
  }, [isOpen, orderId]);

  const fetchFiles = async () => {
    setLoading(true);
    setError(false);
    try {
      const designWorks = await pb.collection('design_work').getFullList({
        filter: `order_id = "${orderId}" && design_file != ""`,
        expand: 'designer_id',
        $autoCancel: false
      });

      const extractedFiles = (designWorks || []).flatMap(dw => 
        (dw.design_file || []).map(filename => ({
          id: `${dw.id}-${filename}`,
          filename,
          url: pb.files.getURL(dw, filename),
          uploadDate: dw.updated,
          designerName: dw.expand?.designer_id?.name || 'Unknown Designer',
          recordId: dw.id,
          size: 'Calculating...'
        }))
      );

      setFiles(extractedFiles);

      extractedFiles.forEach(async (f) => {
        try {
          const res = await fetch(f.url, { method: 'HEAD' });
          const sizeBytes = res.headers.get('content-length');
          if (sizeBytes) {
            const bytes = parseInt(sizeBytes, 10);
            let sizeStr = '';
            if (bytes < 1024 * 1024) sizeStr = (bytes / 1024).toFixed(1) + ' KB';
            else sizeStr = (bytes / (1024 * 1024)).toFixed(1) + ' MB';
            
            setFiles(prev => prev.map(pf => pf.id === f.id ? { ...pf, size: sizeStr } : pf));
          } else {
            setFiles(prev => prev.map(pf => pf.id === f.id ? { ...pf, size: 'Unknown size' } : pf));
          }
        } catch {
          setFiles(prev => prev.map(pf => pf.id === f.id ? { ...pf, size: 'Unknown size' } : pf));
        }
      });

    } catch (err) {
      console.error('Failed to fetch files', err);
      setError(true);
      toast.error('Failed to load design files');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (file) => {
    setDownloadingId(file.id);
    try {
      const response = await fetch(file.url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = blobUrl;
      const cleanName = file.filename.replace(/_[a-zA-Z0-9]{10,}\./, '.');
      link.download = cleanName || 'download';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
      
      toast.success('Download complete');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file');
    } finally {
      setDownloadingId(null);
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
            Download available design assets and documentation for this event.
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
          ) : files.length === 0 ? (
            <div className="py-12 flex flex-col items-center justify-center text-center bg-background rounded-xl border border-dashed border-border/60">
              <div className="w-16 h-16 bg-muted/50 rounded-full flex items-center justify-center mx-auto mb-4">
                <File className="w-8 h-8 text-muted-foreground/50" />
              </div>
              <h4 className="font-semibold text-foreground mb-1">No files available yet</h4>
              <p className="text-sm text-muted-foreground max-w-[250px]">
                The designer hasn't uploaded any final assets for this event yet.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {files.map((file) => (
                <div key={file.id} className="group p-4 bg-card border border-border/60 rounded-xl shadow-sm hover:border-[hsl(var(--accent-yellow))] transition-colors flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 min-w-0 flex-1">
                    <div className="p-2 bg-[hsl(var(--accent-yellow))]/10 rounded-lg text-[hsl(var(--accent-yellow-active))] shrink-0">
                      <File className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-sm text-foreground truncate" title={file.filename}>
                        {file.filename.replace(/_[a-zA-Z0-9]{10,}\./, '.')}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <User className="w-3 h-3" /> {file.designerName}
                        </span>
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> {file.uploadDate ? format(new Date(file.uploadDate), 'MMM d, yyyy') : 'Unknown'}
                        </span>
                        <span className="font-numeric bg-muted px-1.5 py-0.5 rounded">{file.size}</span>
                      </div>
                    </div>
                  </div>
                  
                  <Button 
                    size="sm" 
                    onClick={() => handleDownload(file)} 
                    disabled={downloadingId === file.id}
                    className="shrink-0 shadow-sm bg-[hsl(var(--accent-yellow))] hover:bg-[hsl(var(--accent-yellow-hover))] text-black font-semibold w-full sm:w-auto"
                  >
                    {downloadingId === file.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Download className="w-4 h-4 mr-2" />
                    )}
                    {downloadingId === file.id ? 'Saving...' : 'Download'}
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