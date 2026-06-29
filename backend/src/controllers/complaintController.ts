import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import cloudinary from '../config/cloudinary';
import { asyncHandler } from '../utils/asyncHandler';
import { CustomError } from '../utils/customError';
import { generateTicketNo } from '../utils/ticketGenerator';
import { createAuditLog } from '../utils/auditLogger';
import {
  createComplaintSchema,
  updateComplaintStatusSchema,
  assignComplaintSchema,
  addCommentSchema,
} from '../validation/complaintValidation';

// ─── Helper: Upload buffer to Cloudinary ──────────────────────────────────────
async function uploadToCloudinary(
  fileBuffer: Buffer,
  originalname: string,
  mimetype: string
): Promise<string> {
  return new Promise((resolve, reject) => {
    const resourceType = mimetype.startsWith('image') ? 'image' : 'raw';
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'complaint-portal/attachments',
        resource_type: resourceType,
        public_id: `${Date.now()}-${originalname.replace(/\s+/g, '_')}`,
      },
      (error, result) => {
        if (error || !result) return reject(error || new Error('Upload failed'));
        resolve(result.secure_url);
      }
    );
    uploadStream.end(fileBuffer);
  });
}

// ─── CREATE COMPLAINT ─────────────────────────────────────────────────────────
export const createComplaint = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const parsed = createComplaintSchema.safeParse(req.body);
  if (!parsed.success) {
    throw new CustomError(parsed.error.errors[0].message, 400);
  }

  const { subject, description, categoryId, departmentId, priority } = parsed.data;

  // Upload attachments if any
  const attachmentUrls: string[] = [];
  if (req.files && Array.isArray(req.files)) {
    for (const file of req.files as Express.Multer.File[]) {
      const url = await uploadToCloudinary(file.buffer, file.originalname, file.mimetype);
      attachmentUrls.push(url);
    }
  }

  const ticketNo = generateTicketNo();

  const complaint = await prisma.complaint.create({
    data: {
      ticketNo,
      subject,
      description,
      categoryId,
      departmentId,
      employeeId: req.user.id,
      priority: priority ?? 'MEDIUM',
      attachments: attachmentUrls,
      timelineEvents: {
        create: {
          userId: req.user.id,
          message: 'Complaint submitted successfully.',
        },
      },
    },
    include: {
      category: true,
      department: true,
      employee: { select: { id: true, name: true, employeeId: true } },
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'COMPLAINT_CREATED',
    details: JSON.stringify({ ticketNo, subject }),
    ipAddress: req.ip,
  });

  res.status(201).json({
    status: 'success',
    data: { complaint },
  });
});

// ─── GET MY COMPLAINTS (Employee) ─────────────────────────────────────────────
export const getMyComplaints = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;

  const where: any = {
    employeeId: req.user.id,
    isDeleted: false,
  };
  if (status) where.status = status;
  if (priority) where.priority = priority;

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        assignedEngineer: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      complaints,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// ─── GET ALL COMPLAINTS (Admin) ───────────────────────────────────────────────
export const getAllComplaints = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 15;
  const status = req.query.status as string | undefined;
  const priority = req.query.priority as string | undefined;
  const departmentId = req.query.departmentId as string | undefined;
  const categoryId = req.query.categoryId as string | undefined;
  const search = req.query.search as string | undefined;

  const where: any = { isDeleted: false };
  if (status) where.status = status;
  if (priority) where.priority = priority;
  if (departmentId) where.departmentId = departmentId;
  if (categoryId) where.categoryId = categoryId;
  if (search) {
    where.OR = [
      { subject: { contains: search, mode: 'insensitive' } },
      { ticketNo: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [complaints, total] = await Promise.all([
    prisma.complaint.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } },
        employee: { select: { id: true, name: true, employeeId: true } },
        assignedEngineer: { select: { id: true, name: true } },
        _count: { select: { comments: true } },
      },
    }),
    prisma.complaint.count({ where }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      complaints,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    },
  });
});

// ─── GET SINGLE COMPLAINT ─────────────────────────────────────────────────────
export const getComplaintById = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const { id } = req.params;
  const complaint = await prisma.complaint.findFirst({
    where: {
      id,
      isDeleted: false,
      // Employees can only view their own; admins can view all
      ...(req.user.role === 'EMPLOYEE' ? { employeeId: req.user.id } : {}),
    },
    include: {
      category: true,
      department: true,
      employee: { select: { id: true, name: true, employeeId: true, email: true } },
      assignedEngineer: { select: { id: true, name: true, employeeId: true } },
      comments: {
        where: req.user.role === 'EMPLOYEE' ? { isInternal: false } : {},
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
      timelineEvents: {
        include: { user: { select: { id: true, name: true, role: true } } },
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!complaint) throw new CustomError('Complaint not found or access denied', 404);

  res.status(200).json({ status: 'success', data: { complaint } });
});

// ─── UPDATE STATUS (Admin) ────────────────────────────────────────────────────
export const updateComplaintStatus = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const { id } = req.params;
  const parsed = updateComplaintStatusSchema.safeParse(req.body);
  if (!parsed.success) throw new CustomError(parsed.error.errors[0].message, 400);

  const { status, resolutionNotes } = parsed.data;

  const existing = await prisma.complaint.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new CustomError('Complaint not found', 404);

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      status,
      ...(resolutionNotes ? { resolutionNotes } : {}),
      timelineEvents: {
        create: {
          userId: req.user.id,
          message: `Status updated to "${status}"${resolutionNotes ? ` — Note: ${resolutionNotes}` : ''}.`,
        },
      },
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'COMPLAINT_STATUS_UPDATED',
    details: JSON.stringify({ ticketNo: existing.ticketNo, oldStatus: existing.status, newStatus: status }),
    ipAddress: req.ip,
  });

  res.status(200).json({ status: 'success', data: { complaint } });
});

// ─── ASSIGN COMPLAINT (Admin) ─────────────────────────────────────────────────
export const assignComplaint = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const { id } = req.params;
  const parsed = assignComplaintSchema.safeParse(req.body);
  if (!parsed.success) throw new CustomError(parsed.error.errors[0].message, 400);

  const { assignedEngineerId } = parsed.data;

  // Verify engineer exists
  const engineer = await prisma.user.findUnique({
    where: { id: assignedEngineerId },
    select: { id: true, name: true },
  });
  if (!engineer) throw new CustomError('Engineer not found', 404);

  const existing = await prisma.complaint.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new CustomError('Complaint not found', 404);

  const complaint = await prisma.complaint.update({
    where: { id },
    data: {
      assignedEngineerId,
      status: 'ASSIGNED',
      timelineEvents: {
        create: {
          userId: req.user.id,
          message: `Complaint assigned to ${engineer.name}.`,
        },
      },
    },
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'COMPLAINT_ASSIGNED',
    details: JSON.stringify({ ticketNo: existing.ticketNo, assignedTo: engineer.name }),
    ipAddress: req.ip,
  });

  res.status(200).json({ status: 'success', data: { complaint } });
});

// ─── ADD COMMENT ──────────────────────────────────────────────────────────────
export const addComment = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const { id } = req.params;
  const parsed = addCommentSchema.safeParse(req.body);
  if (!parsed.success) throw new CustomError(parsed.error.errors[0].message, 400);

  const { content, isInternal } = parsed.data;

  // Employees cannot post internal comments
  const actualIsInternal = req.user.role === 'ADMIN' ? isInternal : false;

  const complaint = await prisma.complaint.findFirst({
    where: { id, isDeleted: false },
  });
  if (!complaint) throw new CustomError('Complaint not found', 404);

  // Employees can only comment on their own complaints
  if (req.user.role === 'EMPLOYEE' && complaint.employeeId !== req.user.id) {
    throw new CustomError('Access denied', 403);
  }

  const comment = await prisma.comment.create({
    data: {
      complaintId: id,
      userId: req.user.id,
      content,
      isInternal: actualIsInternal,
    },
    include: {
      user: { select: { id: true, name: true, role: true } },
    },
  });

  // Add timeline event
  await prisma.timelineEvent.create({
    data: {
      complaintId: id,
      userId: req.user.id,
      message: actualIsInternal ? 'Internal note added.' : 'Comment added.',
    },
  });

  res.status(201).json({ status: 'success', data: { comment } });
});

// ─── SOFT DELETE (Admin) ──────────────────────────────────────────────────────
export const deleteComplaint = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const { id } = req.params;
  const existing = await prisma.complaint.findFirst({ where: { id, isDeleted: false } });
  if (!existing) throw new CustomError('Complaint not found', 404);

  await prisma.complaint.update({
    where: { id },
    data: { isDeleted: true },
  });

  await createAuditLog({
    userId: req.user.id,
    action: 'COMPLAINT_DELETED',
    details: JSON.stringify({ ticketNo: existing.ticketNo }),
    ipAddress: req.ip,
  });

  res.status(200).json({ status: 'success', message: 'Complaint deleted successfully' });
});

// ─── GET REFERENCE DATA (Departments + Categories) ───────────────────────────
export const getReferenceData = asyncHandler(async (_req: Request, res: Response) => {
  const [departments, categories] = await Promise.all([
    prisma.department.findMany({ orderBy: { name: 'asc' } }),
    prisma.category.findMany({ orderBy: { name: 'asc' } }),
  ]);

  res.status(200).json({ status: 'success', data: { departments, categories } });
});
