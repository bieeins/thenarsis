import { z } from 'zod';

export const createPaymentSchema = z.object({
  invoice_id: z.string().min(1),
  amount: z.coerce.number().min(0),
  payment_date: z.string().min(1),
  payment_method: z.enum(['Bank Transfer', 'Credit Card', 'E-wallet', 'Cash', 'Check', 'Other']),
  notes: z.string().optional().nullable(),
  payment_status: z.enum(['Pending', 'Confirmed', 'Failed']).default('Pending'),
});

export const updatePaymentSchema = createPaymentSchema.partial();

export const paymentsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  status: z.enum(['Pending', 'Confirmed', 'Failed']).optional(),
  invoiceId: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
