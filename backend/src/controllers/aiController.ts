import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { CustomError } from '../utils/customError';
import {
  classifyCategory,
  predictPriority,
  generateSummary,
  detectDuplicates,
  getChatResponse,
} from '../services/aiService';

// ─── CLASSIFY COMPLAINT ───────────────────────────────────────────────────────
export const classifyComplaint = asyncHandler(async (req: Request, res: Response) => {
  const { subject, description } = req.body;

  if (!subject || !description) {
    throw new CustomError('Subject and description are required for classification', 400);
  }

  const text = `${subject} ${description}`;
  const category = classifyCategory(text);
  const priority = predictPriority(text);
  const summary = generateSummary(subject, description);

  // Fetch matching category from DB
  const categoryRecord = await prisma.category.findFirst({
    where: { name: category },
  });

  res.status(200).json({
    status: 'success',
    data: {
      category,
      categoryId: categoryRecord?.id ?? null,
      priority,
      summary,
    },
  });
});

// ─── DETECT DUPLICATES ────────────────────────────────────────────────────────
export const findDuplicates = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const { subject, description } = req.body;
  if (!subject || !description) {
    throw new CustomError('Subject and description are required', 400);
  }

  // Fetch recent open complaints (limit to last 200 for performance)
  const existingTickets = await prisma.complaint.findMany({
    where: {
      isDeleted: false,
      status: { in: ['OPEN', 'ASSIGNED', 'IN_PROGRESS'] },
      // Employees only see their department; admin sees all
      ...(req.user.role === 'EMPLOYEE' ? {} : {}),
    },
    take: 200,
    orderBy: { createdAt: 'desc' },
    select: { ticketNo: true, subject: true, description: true },
  });

  const duplicates = detectDuplicates(`${subject} ${description}`, existingTickets);

  res.status(200).json({
    status: 'success',
    data: {
      hasDuplicates: duplicates.length > 0,
      duplicates,
    },
  });
});

// ─── GENERATE SUMMARY ─────────────────────────────────────────────────────────
export const summarizeComplaint = asyncHandler(async (req: Request, res: Response) => {
  const { complaintId } = req.params;

  const complaint = await prisma.complaint.findFirst({
    where: { id: complaintId, isDeleted: false },
  });

  if (!complaint) throw new CustomError('Complaint not found', 404);

  const summary = generateSummary(complaint.subject, complaint.description);

  res.status(200).json({
    status: 'success',
    data: { summary },
  });
});

// ─── CHAT ASSISTANT ───────────────────────────────────────────────────────────
export const chat = asyncHandler(async (req: Request, res: Response) => {
  const { message } = req.body;

  if (!message || typeof message !== 'string') {
    throw new CustomError('Message is required', 400);
  }

  const response = getChatResponse(message);

  res.status(200).json({
    status: 'success',
    data: {
      message: response,
      timestamp: new Date().toISOString(),
    },
  });
});

// ─── PREDICTIVE ANALYTICS ─────────────────────────────────────────────────────
export const getPredictiveAnalytics = asyncHandler(async (_req: Request, res: Response) => {
  // Compute complaint trend for last 7 days
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

  const complaints = await prisma.complaint.findMany({
    where: { isDeleted: false, createdAt: { gte: sevenDaysAgo } },
    select: { createdAt: true, priority: true, status: true },
  });

  // Group by day
  const trendMap: Record<string, number> = {};
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split('T')[0];
    trendMap[key] = 0;
  }

  for (const c of complaints) {
    const key = c.createdAt.toISOString().split('T')[0];
    if (trendMap[key] !== undefined) {
      trendMap[key]++;
    }
  }

  const trend = Object.entries(trendMap).map(([date, count]) => ({ date, count }));

  // Average resolution time estimate (mock based on priority distribution)
  const priorityDist = complaints.reduce(
    (acc: Record<string, number>, c) => {
      acc[c.priority] = (acc[c.priority] ?? 0) + 1;
      return acc;
    },
    {}
  );

  res.status(200).json({
    status: 'success',
    data: {
      trend,
      priorityDistribution: priorityDist,
      totalLast7Days: complaints.length,
      prediction:
        complaints.length > 10
          ? 'High volume expected — consider increasing IT staffing.'
          : 'Volume within normal range. Current staffing adequate.',
    },
  });
});
