import { z } from 'zod';

export const createNotificationSchema = z.object({
  user_id: z.string().min(1).optional(),
  type: z.enum(['assignment', 'status_change', 'design_ready', 'payment_received']),
  title: z.string().min(1),
  message: z.string().min(1),
  related_order_id: z.string().optional().nullable(),
});
