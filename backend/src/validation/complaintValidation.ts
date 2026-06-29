import { z } from 'zod';

export const createComplaintSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200, 'Subject too long'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(5000, 'Description too long'),
  categoryId: z.string().uuid('Invalid category'),
  departmentId: z.string().uuid('Invalid department'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

export const updateComplaintStatusSchema = z.object({
  status: z.enum([
    'OPEN',
    'ASSIGNED',
    'IN_PROGRESS',
    'WAITING_FOR_USER',
    'RESOLVED',
    'CLOSED',
    'REJECTED',
  ]),
  resolutionNotes: z.string().max(2000).optional(),
});

export const assignComplaintSchema = z.object({
  assignedEngineerId: z.string().uuid('Invalid engineer ID'),
});

export const addCommentSchema = z.object({
  content: z.string().min(1, 'Comment cannot be empty').max(2000, 'Comment too long'),
  isInternal: z.boolean().optional().default(false),
});
