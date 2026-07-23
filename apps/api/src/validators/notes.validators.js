import { z } from 'zod';

export const createNoteSchema = z.object({
  order_id: z.string().min(1),
  user_role: z.enum(['owner', 'designer', 'crew']),
  user_name: z.string().min(1),
  note_content: z.string().min(1),
});

export const updateNoteSchema = z.object({
  note_content: z.string().min(1),
});
