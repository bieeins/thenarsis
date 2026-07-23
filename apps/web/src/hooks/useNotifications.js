import { useState, useEffect, useCallback } from 'react';
import pb from '@/lib/pocketbaseClient';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useNotifications = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;
    
    try {
      const records = await pb.collection('notifications').getFullList({
        filter: `user_id = "${currentUser.id}"`,
        sort: '-created',
        $autoCancel: false
      });
      
      setNotifications(records);
      setUnreadCount(records.filter(n => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    fetchNotifications();

    if (isAuthenticated && currentUser) {
      pb.collection('notifications').subscribe('*', function (e) {
        if (e.action === 'create' && e.record.user_id === currentUser.id) {
          setNotifications(prev => [e.record, ...prev]);
          setUnreadCount(prev => prev + 1);
          toast.info(e.record.title, { description: e.record.message });
        } else if (e.action === 'update' && e.record.user_id === currentUser.id) {
          setNotifications(prev => prev.map(n => n.id === e.record.id ? e.record : n));
          fetchNotifications(); // Recalculate unread count
        } else if (e.action === 'delete') {
          setNotifications(prev => prev.filter(n => n.id !== e.record.id));
          fetchNotifications();
        }
      });
    }

    return () => {
      pb.collection('notifications').unsubscribe('*');
    };
  }, [fetchNotifications, isAuthenticated, currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      await pb.collection('notifications').update(notificationId, { is_read: true }, { $autoCancel: false });
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await pb.collection('notifications').delete(notificationId, { $autoCancel: false });
      setNotifications(prev => prev.filter(n => n.id !== notificationId));
      fetchNotifications();
    } catch (error) {
      console.error('Failed to delete notification:', error);
    }
  };

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    deleteNotification,
    fetchNotifications
  };
};