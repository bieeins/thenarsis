import React, { useState, useEffect } from 'react';
import { Helmet } from 'react-helmet';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Bell, CheckCircle2, Circle, Trash2, Clock, Calendar, FileImage, DollarSign } from 'lucide-react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

const Notifications = () => {
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (currentUser) {
      loadNotifications();
    }
  }, [currentUser]);

  const loadNotifications = async () => {
    try {
      const records = await pb.collection('notifications').getFullList({
        filter: `user_id = "${currentUser.id}"`,
        sort: '-created_date',
        $autoCancel: false
      });
      setNotifications(records);
    } catch (error) {
      toast.error('Failed to load notifications');
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id, currentStatus) => {
    try {
      await pb.collection('notifications').update(id, {
        is_read: !currentStatus
      }, { $autoCancel: false });
      setNotifications(notifications.map(n => n.id === id ? { ...n, is_read: !currentStatus } : n));
    } catch (error) {
      toast.error('Failed to update notification');
    }
  };

  const markAllAsRead = async () => {
    try {
      const unread = notifications.filter(n => !n.is_read);
      await Promise.all(unread.map(n => 
        pb.collection('notifications').update(n.id, { is_read: true }, { $autoCancel: false })
      ));
      setNotifications(notifications.map(n => ({ ...n, is_read: true })));
      toast.success('All marked as read');
    } catch (error) {
      toast.error('Failed to update notifications');
    }
  };

  const deleteNotification = async (id) => {
    try {
      await pb.collection('notifications').delete(id, { $autoCancel: false });
      setNotifications(notifications.filter(n => n.id !== id));
      toast.success('Notification deleted');
    } catch (error) {
      toast.error('Failed to delete notification');
    }
  };

  const getIcon = (type) => {
    switch(type) {
      case 'assignment': return <Calendar className="w-5 h-5 text-blue-500" />;
      case 'status_change': return <Clock className="w-5 h-5 text-orange-500" />;
      case 'design_ready': return <FileImage className="w-5 h-5 text-green-500" />;
      case 'payment_received': return <DollarSign className="w-5 h-5 text-primary" />;
      default: return <Bell className="w-5 h-5 text-muted-foreground" />;
    }
  };

  const getLinkForNotification = (notification) => {
    if (!notification.related_order_id) return '#';
    // Navigate based on user role and related item
    if (currentUser?.role === 'designer') {
      return `/design-work`; // Would need to find the specific design_work ID, link to list for now
    }
    if (currentUser?.role === 'crew') {
      return `/assigned-events`;
    }
    return `/order/${notification.related_order_id}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      </div>
    );
  }

  const unreadCount = notifications.filter(n => !n.is_read).length;

  return (
    <>
      <Helmet>
        <title>Notifications - Thenarsis</title>
      </Helmet>
      
      <div className="min-h-screen bg-muted/30 py-8">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
              <p className="text-muted-foreground mt-1">You have {unreadCount} unread messages</p>
            </div>
            {unreadCount > 0 && (
              <Button variant="outline" onClick={markAllAsRead}>
                Mark all as read
              </Button>
            )}
          </div>

          <Card className="border-0 shadow-lg">
            <CardContent className="p-0">
              <div className="divide-y divide-border">
                <AnimatePresence>
                  {notifications.length === 0 ? (
                    <div className="p-12 text-center text-muted-foreground">
                      <Bell className="w-12 h-12 mx-auto mb-4 opacity-20" />
                      <p>You're all caught up!</p>
                    </div>
                  ) : (
                    notifications.map((notif) => (
                      <motion.div
                        key={notif.id}
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className={`p-4 sm:p-6 flex gap-4 transition-colors hover:bg-muted/50 ${!notif.is_read ? 'bg-primary/5' : ''}`}
                      >
                        <div className="mt-1 flex-shrink-0">
                          {getIcon(notif.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <Link to={getLinkForNotification(notif)} className="block focus:outline-none">
                            <h3 className={`text-base font-medium ${!notif.is_read ? 'text-foreground' : 'text-foreground/80'}`}>
                              {notif.title}
                            </h3>
                            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                              {notif.message}
                            </p>
                            <span className="text-xs text-muted-foreground mt-2 block">
                              {formatDistanceToNow(new Date(notif.created_date || notif.created), { addSuffix: true })}
                            </span>
                          </Link>
                        </div>
                        <div className="flex flex-col items-end gap-2 flex-shrink-0">
                          <button
                            onClick={() => markAsRead(notif.id, notif.is_read)}
                            className="text-muted-foreground hover:text-primary transition-colors p-1"
                            title={notif.is_read ? "Mark as unread" : "Mark as read"}
                          >
                            {notif.is_read ? <CheckCircle2 className="w-5 h-5" /> : <Circle className="w-5 h-5 text-primary" />}
                          </button>
                          <button
                            onClick={() => deleteNotification(notif.id)}
                            className="text-muted-foreground hover:text-destructive transition-colors p-1"
                            title="Delete notification"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </motion.div>
                    ))
                  )}
                </AnimatePresence>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Notifications;