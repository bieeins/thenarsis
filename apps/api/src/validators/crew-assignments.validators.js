import { z } from 'zod';

export const createCrewAssignmentSchema = z.object({
  order_id: z.string().min(1),
  crew_id: z.string().min(1),
  fee: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed']).default('pending'),
  assigned_by: z.string().optional().nullable(),
});

export const updateCrewAssignmentSchema = z.object({
  fee: z.coerce.number().min(0).optional().nullable(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  paid_amount: z.coerce.number().min(0).optional().nullable(),
  pending_amount: z.coerce.number().min(0).optional().nullable(),
  attendance_status: z.enum(['pending', 'confirmed', 'completed', 'hadir']).optional().nullable(),
  attendance_reason: z.string().optional().nullable(),
  attendance_amount: z.coerce.number().min(0).optional().nullable(),
  crew_notes: z.string().optional().nullable(),
  check_in_time: z.string().optional().nullable(),
  check_out_time: z.string().optional().nullable(),
  attendance_confirmation: z.boolean().optional().nullable(),
});

export const crewAssignmentsListQuerySchema = z.object({
  page: z.coerce.number().optional(),
  perPage: z.coerce.number().optional(),
  crewId: z.string().optional(),
  orderId: z.string().optional(),
  status: z.enum(['pending', 'in_progress', 'completed']).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional(),
});
