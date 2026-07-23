import { z } from 'zod';

export const orderItemSchema = z.object({
  order_id: z.string().min(1),
  product_id: z.string().min(1),
  base_price: z.coerce.number().min(0),
  adjusted_price: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().int().min(1),
});

export const orderItemUpdateSchema = orderItemSchema.partial();
