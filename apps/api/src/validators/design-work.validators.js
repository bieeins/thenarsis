import { z } from 'zod';

export const createDesignWorkSchema = z.object({
  order_id: z.string().min(1),
  designer_id: z.string().min(1),
  design_notes: z.string().optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'revision', 'completed']).default('pending'),
  design_fee: z.coerce.number().min(0).optional().nullable(),
  design_file_link: z.string().url().optional().nullable(),
  assigned_by: z.string().optional().nullable(),
  fee_submitted_date: z.string().optional().nullable(),
});

export const updateDesignWorkSchema = createDesignWorkSchema.omit({ order_id: true, designer_id: true }).partial();

export const designWorkListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  designerId: z.string().optional(),
  orderId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'revision', 'completed']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
