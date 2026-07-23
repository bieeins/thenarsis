import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { notificationService } from '@/services/notificationService.js';

const POLL_INTERVAL_MS = 30000;

export const useNotifications = () => {
  const { currentUser, isAuthenticated } = useAuth();
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const knownIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated || !currentUser) return;

    try {
      const records = await notificationService.listMine();
      const sorted = [...records].sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at)
      );

      if (!isFirstLoad.current) {
        const newOnes = sorted.filter((n) => !knownIds.current.has(n.id));
        newOnes.forEach((n) => {
          toast.info(n.title, { description: n.message });
        });
      }
      knownIds.current = new Set(sorted.map((n) => n.id));
      isFirstLoad.current = false;

      setNotifications(sorted);
      setUnreadCount(sorted.filter((n) => !n.is_read).length);
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [currentUser, isAuthenticated]);

  useEffect(() => {
    if (!isAuthenticated || !currentUser) return;

    fetchNotifications();
    const intervalId = setInterval(fetchNotifications, POLL_INTERVAL_MS);

    return () => {
      clearInterval(intervalId);
    };
  }, [fetchNotifications, isAuthenticated, currentUser]);

  const markAsRead = async (notificationId) => {
    try {
      await notificationService.markRead(notificationId);
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  };

  const deleteNotification = async (notificationId) => {
    try {
      await notificationService.remove(notificationId);
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
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
    fetchNotifications,
  };
};
