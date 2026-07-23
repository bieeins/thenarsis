import pb from '@/lib/pocketbaseClient';
import { format } from 'date-fns';

/**
 * Creates a notification for a user when they are assigned to an order
 * @param {string} userId - The ID of the user being assigned (designer or crew)
 * @param {Object} order - The order object containing event details
 */
export const createAssignmentNotification = async (userId, order) => {
  try {
    const formattedDate = order.event_date 
      ? format(new Date(order.event_date), 'MMM dd, yyyy') 
      : 'Date TBA';
      
    await pb.collection('notifications').create({
      user_id: userId,
      type: 'assignment',
      title: 'Ada Project Masuk',
      message: `${formattedDate}, ${order.event_location || 'Location TBA'}`,
      related_order_id: order.id,
      is_read: false
    }, { $autoCancel: false });
  } catch (error) {
    console.error('Failed to create assignment notification:', error);
  }
};