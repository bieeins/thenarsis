import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, ExternalLink, Clock, Loader2, Link as LinkIcon } from 'lucide-react';
import { format } from 'date-fns';

// NOTE: design_work.design_file (file uploads) was removed from the schema —
// only design_work.design_file_link (a plain text URL) survives. This section
// now simply renders/links that URL instead of listing individual file downloads.
const DesignFilesSection = ({ designWork }) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="border-b border-border pb-4 bg-card">
        <CardTitle className="text-lg flex items-center gap-2">
          <FileText className="w-5 h-5 text-[#FBBF24]" />
          Design Files
        </CardTitle>
        <CardDescription>Event assets provided by the designer</CardDescription>
      </CardHeader>
      <CardContent className="pt-6">
        {!designWork ? (
          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
            <FileText className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">No designer assigned yet</p>
          </div>
        ) : designWork.status === 'pending' && !designWork.design_file_link ? (
          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Menunggu file dari designer</p>
          </div>
        ) : designWork.status === 'in_progress' && !designWork.design_file_link ? (
          <div className="text-center py-10 bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-blue-700 font-medium">Designer masih mengerjakan</p>
          </div>
        ) : designWork.status === 'revision' ? (
          <div className="text-center py-10 bg-orange-50/50 rounded-xl border border-dashed border-orange-200">
            <Clock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <p className="text-orange-700 font-medium">Designer sedang revisi</p>
          </div>
        ) : designWork.design_file_link ? (
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-xl hover:border-[#FBBF24]/30 transition-colors shadow-sm gap-4">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="p-2 bg-[#FFFBEB] text-[#D97706] rounded-lg shrink-0">
                  <LinkIcon className="w-5 h-5" />
                </div>
                <div className="flex flex-col min-w-0">
                  <span className="font-semibold text-sm truncate text-foreground">Project Files</span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                    <span className="truncate max-w-[220px]">{designWork.design_file_link}</span>
                    {designWork.updated_at && (
                      <>
                        <span>•</span>
                        <span>{format(new Date(designWork.updated_at), 'MMM dd, yyyy')}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                asChild
                className="shrink-0 bg-[#FBBF24] hover:bg-[#F59E0B] text-black transition-colors"
              >
                <a href={designWork.design_file_link} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="w-4 h-4 mr-1.5" /> Open
                </a>
              </Button>
            </div>

            {designWork.designer && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end pt-2">
                <span>Uploaded by:</span>
                <span className="font-medium text-foreground">{designWork.designer.name}</span>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
            <p className="text-sm text-muted-foreground">Work marked as completed, but no link was attached.</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignFilesSection;
