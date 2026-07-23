import { z } from 'zod';

export const createInvoiceSchema = z.object({
  order_id: z.string().min(1),
  invoice_number: z.string().min(1),
  total_amount: z.coerce.number().min(0),
});

export const updateInvoiceSchema = createInvoiceSchema.partial();

export const invoicesListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  search: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
