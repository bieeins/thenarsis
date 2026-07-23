import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { FileText, Download, Clock, Image as ImageIcon, FileArchive, File, Loader2 } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { toast } from 'sonner';
import { format } from 'date-fns';

const DesignFilesSection = ({ designWork }) => {
  const [downloadingFile, setDownloadingFile] = useState(null);

  const handleDownload = async (filename) => {
    setDownloadingFile(filename);
    try {
      const url = pb.files.getURL(designWork, filename);
      const response = await fetch(url);
      if (!response.ok) throw new Error('Network response was not ok');
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
      toast.success('File downloaded successfully');
    } catch (error) {
      toast.error('Failed to download file. Please try again.');
    } finally {
      setDownloadingFile(null);
    }
  };

  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return <ImageIcon className="w-5 h-5" />;
    if (['zip', 'rar', 'tar'].includes(ext)) return <FileArchive className="w-5 h-5" />;
    return <File className="w-5 h-5" />;
  };

  const getFileSizeEstimate = (filename) => {
    // PocketBase doesn't expose file sizes in standard getOne without extra meta, 
    // simulating a placeholder or just showing "Asset" if size unavailable
    return "Download to view size";
  };

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
        ) : designWork.status === 'pending' && (!designWork.design_file || designWork.design_file.length === 0) ? (
          <div className="text-center py-10 bg-muted/20 rounded-xl border border-dashed">
            <Clock className="w-8 h-8 text-muted-foreground/30 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Menunggu file dari designer</p>
          </div>
        ) : designWork.status === 'in_progress' && (!designWork.design_file || designWork.design_file.length === 0) ? (
          <div className="text-center py-10 bg-blue-50/50 rounded-xl border border-dashed border-blue-200">
            <Loader2 className="w-8 h-8 text-blue-400 animate-spin mx-auto mb-3" />
            <p className="text-blue-700 font-medium">Designer masih mengerjakan</p>
          </div>
        ) : designWork.status === 'revision' ? (
          <div className="text-center py-10 bg-orange-50/50 rounded-xl border border-dashed border-orange-200">
            <Clock className="w-8 h-8 text-orange-400 mx-auto mb-3" />
            <p className="text-orange-700 font-medium">Designer sedang revisi</p>
          </div>
        ) : (
          <div className="space-y-4">
            {designWork.design_file && designWork.design_file.length > 0 ? (
              <div className="grid gap-3">
                {designWork.design_file.map((filename, i) => (
                  <div key={i} className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-card border rounded-xl hover:border-[#FBBF24]/30 transition-colors shadow-sm gap-4">
                    <div className="flex items-center gap-3 overflow-hidden">
                      <div className="p-2 bg-[#FFFBEB] text-[#D97706] rounded-lg shrink-0">
                        {getFileIcon(filename)}
                      </div>
                      <div className="flex flex-col min-w-0">
                        <span className="font-semibold text-sm truncate text-foreground">{filename}</span>
                        <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                          <span>{getFileSizeEstimate(filename)}</span>
                          <span>•</span>
                          <span>{format(new Date(designWork.updated), 'MMM dd, yyyy')}</span>
                        </div>
                      </div>
                    </div>
                    <Button 
                      size="sm" 
                      className="shrink-0 bg-[#FBBF24] hover:bg-[#F59E0B] text-black transition-colors"
                      onClick={() => handleDownload(filename)}
                      disabled={downloadingFile === filename}
                    >
                      {downloadingFile === filename ? (
                        <><Loader2 className="w-4 h-4 mr-1.5 animate-spin" /> Fetching...</>
                      ) : (
                        <><Download className="w-4 h-4 mr-1.5" /> Download</>
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 bg-muted/20 rounded-xl border border-dashed">
                <p className="text-sm text-muted-foreground">Work marked as completed, but no files were attached.</p>
              </div>
            )}
            
            {designWork.expand?.designer_id && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground justify-end pt-2">
                <span>Uploaded by:</span>
                <span className="font-medium text-foreground">{designWork.expand.designer_id.name}</span>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default DesignFilesSection;