import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import {
  Activity, Calendar, UserPlus, UploadCloud, MessageSquare,
  CheckCircle2, TrendingUp, DollarSign, Loader2,
  Image as ImageIcon, FileArchive, File, Palette
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow, format } from 'date-fns';

// NOTE: design_work.design_file (file uploads) was removed from the schema —
// activity.files (if ever populated) can no longer be downloaded via a
// PocketBase-style file URL, so this timeline just lists the filenames.
const ActivityTimeline = ({ activities, loading, eventName }) => {
  const getFileIcon = (filename) => {
    const ext = filename.split('.').pop().toLowerCase();
    if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext)) return <ImageIcon className="w-4 h-4" />;
    if (['zip', 'rar', 'tar'].includes(ext)) return <FileArchive className="w-4 h-4" />;
    return <File className="w-4 h-4" />;
  };

  const getActivityIcon = (type) => {
    switch (type) {
      case 'event_created': return <Calendar className="w-4 h-4" />;
      case 'crew_assigned': return <UserPlus className="w-4 h-4" />;
      case 'designer_assigned': return <Palette className="w-4 h-4" />;
      case 'files_uploaded': return <UploadCloud className="w-4 h-4" />;
      case 'attendance': return <CheckCircle2 className="w-4 h-4" />;
      case 'note_added': return <MessageSquare className="w-4 h-4" />;
      case 'status_change': return <TrendingUp className="w-4 h-4" />;
      case 'design_fee': return <DollarSign className="w-4 h-4" />;
      default: return <Activity className="w-4 h-4" />;
    }
  };

  const getActivityColorClass = (type) => {
    switch (type) {
      case 'event_created': return 'timeline-icon-blue';
      case 'crew_assigned': return 'timeline-icon-purple';
      case 'designer_assigned': return 'timeline-icon-purple';
      case 'files_uploaded': return 'timeline-icon-green';
      case 'attendance': return 'timeline-icon-orange';
      case 'note_added': return 'timeline-icon-yellow';
      case 'status_change': return 'timeline-icon-gray';
      case 'design_fee': return 'timeline-icon-gold';
      default: return 'timeline-icon-gray';
    }
  };

  return (
    <Card className="border-0 shadow-lg h-full flex flex-col">
      <CardHeader className="border-b border-border pb-4 bg-card shrink-0">
        <CardTitle className="text-lg flex items-center gap-2">
          <Activity className="w-5 h-5 text-primary" />
          Activity Timeline
        </CardTitle>
        <CardDescription className="truncate">
          {eventName ? `History for ${eventName}` : 'Select an event to view history'}
        </CardDescription>
      </CardHeader>
      <CardContent className="pt-6 flex-1 overflow-y-auto relative">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground">
            <Loader2 className="w-8 h-8 animate-spin mb-4 text-primary" />
            <p>Loading activity history...</p>
          </div>
        ) : !activities || activities.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full py-12 text-muted-foreground bg-muted/20 rounded-xl border border-dashed">
            <Activity className="w-12 h-12 mb-4 opacity-20" />
            <p className="font-medium text-foreground">No activities found</p>
            <p className="text-sm mt-1">Activity history will appear here.</p>
          </div>
        ) : (
          <div className="relative pl-4">
            <div className="timeline-line" />
            <AnimatePresence initial={false}>
              {activities.map((activity, index) => (
                <motion.div 
                  key={activity.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05, duration: 0.3 }}
                  className="relative pl-8 pb-8 last:pb-0 group"
                >
                  <div className={`absolute left-0 top-1 -translate-x-1/2 flex items-center justify-center w-8 h-8 rounded-full border-2 bg-background shadow-sm z-10 transition-transform group-hover:scale-110 ${getActivityColorClass(activity.type)}`}>
                    {getActivityIcon(activity.type)}
                  </div>
                  
                  <div className="bg-card p-4 rounded-xl border shadow-sm group-hover:shadow-md transition-all group-hover:border-primary/30">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
                      <div>
                        <h4 className="font-semibold text-sm text-foreground">{activity.title}</h4>
                        <p className="text-sm text-muted-foreground mt-0.5">{activity.description}</p>
                      </div>
                      <div className="flex flex-col items-end shrink-0">
                        <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-md">
                          {formatDistanceToNow(new Date(activity.timestamp), { addSuffix: true })}
                        </span>
                        <span className="text-[10px] text-muted-foreground/70 mt-1" title={format(new Date(activity.timestamp), 'PPpp')}>
                          {format(new Date(activity.timestamp), 'MMM dd, HH:mm')}
                        </span>
                      </div>
                    </div>

                    {activity.user_name && (
                      <div className="flex items-center gap-1.5 mt-3 text-xs font-medium text-foreground/80">
                        <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-[10px]">
                          {activity.user_name.charAt(0).toUpperCase()}
                        </div>
                        {activity.user_name}
                      </div>
                    )}

                    {activity.type === 'files_uploaded' && activity.files && activity.files.length > 0 && (
                      <div className="mt-4 space-y-2 bg-muted/30 p-3 rounded-lg border border-border/50">
                        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">Attached Files</p>
                        {activity.files.map((filename, i) => (
                          <div key={i} className="flex items-center justify-between bg-background p-2 rounded border shadow-sm">
                            <div className="flex items-center gap-2 min-w-0">
                              <div className="text-primary/70 shrink-0">
                                {getFileIcon(filename)}
                              </div>
                              <span className="text-xs font-medium truncate" title={filename}>{filename}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ActivityTimeline;