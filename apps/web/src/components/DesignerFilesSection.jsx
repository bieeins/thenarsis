import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { Download, File, FileText, Image as ImageIcon, FileCode, Sheet, Presentation, Archive, Loader2, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';
import pb from '@/lib/pocketbaseClient.js';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

const getFileIcon = (filename) => {
  const ext = filename?.split('.').pop()?.toLowerCase();
  switch (ext) {
    case 'pdf': return <FileText className="w-8 h-8 text-red-500" />;
    case 'jpg': case 'jpeg': case 'png': case 'gif': case 'webp': case 'svg': return <ImageIcon className="w-8 h-8 text-blue-500" />;
    case 'doc': case 'docx': return <FileText className="w-8 h-8 text-blue-600" />;
    case 'xls': case 'xlsx': return <Sheet className="w-8 h-8 text-green-600" />;
    case 'ppt': case 'pptx': return <Presentation className="w-8 h-8 text-orange-500" />;
    case 'zip': case 'rar': case '7z': return <Archive className="w-8 h-8 text-gray-500" />;
    case 'js': case 'jsx': case 'css': case 'html': return <FileCode className="w-8 h-8 text-yellow-500" />;
    default: return <File className="w-8 h-8 text-gray-400" />;
  }
};

const formatBytes = (bytes, decimals = 2) => {
  if (!+bytes) return '0 Bytes';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
};

const DesignerFilesSection = ({ orderId }) => {
  const [designWork, setDesignWork] = useState(null);
  const [loading, setLoading] = useState(true);
  const [downloadingFile, setDownloadingFile] = useState(null);

  useEffect(() => {
    const fetchDesignFiles = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const records = await pb.collection('design_work').getFullList({
          filter: `order_id="${orderId}"`,
          expand: 'designer_id',
          $autoCancel: false
        });
        if (records.length > 0) {
          setDesignWork(records[0]);
        }
      } catch (err) {
        console.error('Error fetching design work:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchDesignFiles();
  }, [orderId]);

  const handleDownload = async (filename) => {
    if (!designWork || downloadingFile) return;
    setDownloadingFile(filename);
    try {
      const url = pb.files.getURL(designWork, filename);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      // Strip PocketBase random suffix from filename if possible
      const cleanName = filename.replace(/_[a-zA-Z0-9]{10,}\./, '.');
      a.download = cleanName;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(blobUrl);
      a.remove();
      toast.success('Download completed');
    } catch (err) {
      console.error('Download error:', err);
      toast.error('Failed to download file');
    } finally {
      setDownloadingFile(null);
    }
  };

  const designerName = designWork?.expand?.designer_id?.name || 'Designer';
  const hasFiles = designWork?.design_file && designWork.design_file.length > 0;
  const hasLink = !!designWork?.design_file_link;
  const hasAnyData = hasFiles || hasLink;

  const designLinkInfo = designWork?.design_file_link ? validateAndFormatDesignLink(designWork.design_file_link) : null;

  if (loading) {
    return (
      <Card className="border-0 shadow-md">
        <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
          <Skeleton className="h-6 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="flex gap-4">
            <Skeleton className="h-24 w-full rounded-xl" />
            <Skeleton className="h-24 w-full rounded-xl" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="border-0 shadow-md">
      <CardHeader className="bg-muted/30 border-b border-border/50 pb-4">
        <CardTitle className="text-lg flex items-center gap-2">
          <File className="w-5 h-5 text-[#FBBF24]" />
          Designer Files
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {!hasAnyData ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-border flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <File className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No designs uploaded yet</h3>
            <p className="text-sm text-muted-foreground">The designer will upload files or share a project link here.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {designLinkInfo?.isValid && (
              <div className="bg-card border border-border/80 rounded-xl overflow-hidden shadow-sm p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3 overflow-hidden">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary shrink-0">
                    {designLinkInfo.isImage ? <ImageIcon className="w-5 h-5" /> : <LinkIcon className="w-5 h-5" />}
                  </div>
                  <div className="truncate min-w-0">
                    <p className="font-semibold text-sm">Design Project Link</p>
                    <p className="text-xs text-muted-foreground truncate">{designLinkInfo.url}</p>
                  </div>
                </div>
                <Button className="shrink-0" size="sm" asChild>
                  <a href={designLinkInfo.url} target="_blank" rel="noopener noreferrer">
                    Open Design Link <ExternalLink className="w-4 h-4 ml-2" />
                  </a>
                </Button>
              </div>
            )}

            {designWork?.design_notes && (
              <div className="p-4 bg-muted/30 border rounded-xl text-sm">
                <p className="font-semibold mb-1 flex items-center gap-1.5"><FileText className="w-4 h-4" /> Designer Notes:</p>
                <p className="text-muted-foreground">{designWork.design_notes}</p>
              </div>
            )}

            {hasFiles && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                {designWork.design_file.map((file, idx) => {
                  const cleanName = file.replace(/_[a-zA-Z0-9]{10,}\./, '.');
                  const isDownloading = downloadingFile === file;

                  return (
                    <div key={idx} className="file-card-hover rounded-xl p-4 flex items-center gap-4 bg-card text-card-foreground">
                      <div className="bg-muted/50 p-3 rounded-lg shrink-0">
                        {getFileIcon(file)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate" title={cleanName}>
                          {cleanName}
                        </p>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{designerName}</span>
                          <span>•</span>
                          <span>{format(new Date(designWork.updated), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                      <Button 
                        variant="default"
                        size="icon" 
                        className="shrink-0 bg-[hsl(var(--accent-yellow))] hover:bg-[hsl(var(--accent-yellow-hover))] active:bg-[hsl(var(--accent-yellow-active))] text-black shadow-sm transition-colors"
                        onClick={() => handleDownload(file)}
                        disabled={isDownloading}
                        title="Download File"
                      >
                        {isDownloading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                      </Button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignerFilesSection;