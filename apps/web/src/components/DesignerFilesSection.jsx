import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card.jsx';
import { Button } from '@/components/ui/button.jsx';
import { Skeleton } from '@/components/ui/skeleton.jsx';
import { File, FileText, Image as ImageIcon, Link as LinkIcon, ExternalLink } from 'lucide-react';
import { designWorkService } from '@/services/designWorkService.js';
import { validateAndFormatDesignLink } from '@/lib/validateAndFormatDesignLink.js';

// NOTE: design_work.design_file (file uploads) was removed from the schema —
// only design_work.design_file_link (a plain text URL) survives, so this
// section renders that link instead of a per-file download list.
const DesignerFilesSection = ({ orderId }) => {
  const [designWork, setDesignWork] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDesignFiles = async () => {
      if (!orderId) return;
      try {
        setLoading(true);
        const res = await designWorkService.list({ orderId });
        const records = res.data || [];
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

  const designerName = designWork?.designer?.name || 'Designer';
  const hasLink = !!designWork?.design_file_link;

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
        {!hasLink ? (
          <div className="text-center py-10 bg-slate-50 dark:bg-slate-900 rounded-xl border border-dashed border-border flex flex-col items-center">
            <div className="w-16 h-16 bg-white dark:bg-slate-800 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <File className="w-8 h-8 text-muted-foreground/50" />
            </div>
            <h3 className="text-lg font-bold text-foreground mb-1">No designs uploaded yet</h3>
            <p className="text-sm text-muted-foreground">The designer will share a project link here.</p>
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
                    <p className="text-xs text-muted-foreground mt-0.5">{designerName}</p>
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
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignerFilesSection;
