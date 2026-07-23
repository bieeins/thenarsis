import { z } from 'zod';

export const productSchema = z.object({
  package_name: z.string().min(1),
  description: z.string().optional().nullable(),
  base_price: z.coerce.number().min(0),
  category: z.enum(['Photography', 'Videography', 'Bundle', 'Other']),
});

export const productUpdateSchema = productSchema.partial();

export const productListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  search: z.string().optional(),
  category: z.enum(['Photography', 'Videography', 'Bundle', 'Other']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
