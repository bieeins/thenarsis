import { z } from 'zod';

const orderItemSchema = z.object({
  product_id: z.string().min(1),
  base_price: z.coerce.number().min(0),
  adjusted_price: z.coerce.number().min(0).optional().nullable(),
  quantity: z.coerce.number().int().min(1),
});

export const createOrderSchema = z.object({
  customer_name: z.string().min(1),
  phone_number: z.string().min(1),
  event_name: z.string().min(1),
  event_date: z.string().min(1),
  event_location: z.string().min(1),
  product_id: z.string().min(1),
  assigned_designer_id: z.string().optional().nullable(),
  status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).default('Pending'),
  invoice_number: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  designer_notes: z.string().optional().nullable(),
  items: z.array(orderItemSchema).optional().default([]),
});

export const updateOrderSchema = createOrderSchema.omit({ items: true }).partial();

export const assignDesignerSchema = z.object({
  designer_id: z.string().min(1),
});

export const assignCrewSchema = z.object({
  crew_ids: z.array(z.string().min(1)).default([]),
});

export const ordersListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  search: z.string().optional(),
  status: z.enum(['Pending', 'Confirmed', 'In Progress', 'Completed', 'Cancelled']).optional(),
  designerId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
