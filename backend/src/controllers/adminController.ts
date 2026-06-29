import { Request, Response } from 'express';
import { prisma } from '../config/prisma';
import { asyncHandler } from '../utils/asyncHandler';
import { CustomError } from '../utils/customError';

// ─── DASHBOARD STATS ──────────────────────────────────────────────────────────
export const getDashboardStats = asyncHandler(async (_req: Request, res: Response) => {
  const [
    totalComplaints,
    openComplaints,
    inProgressComplaints,
    resolvedComplaints,
    closedComplaints,
    criticalComplaints,
    highComplaints,
    totalUsers,
    recentComplaints,
    byDepartment,
    byCategory,
    byStatus,
  ] = await Promise.all([
    prisma.complaint.count({ where: { isDeleted: false } }),
    prisma.complaint.count({ where: { isDeleted: false, status: 'OPEN' } }),
    prisma.complaint.count({ where: { isDeleted: false, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { isDeleted: false, status: 'RESOLVED' } }),
    prisma.complaint.count({ where: { isDeleted: false, status: 'CLOSED' } }),
    prisma.complaint.count({ where: { isDeleted: false, priority: 'CRITICAL' } }),
    prisma.complaint.count({ where: { isDeleted: false, priority: 'HIGH' } }),
    prisma.user.count(),
    prisma.complaint.findMany({
      where: { isDeleted: false },
      take: 8,
      orderBy: { createdAt: 'desc' },
      include: {
        category: { select: { name: true } },
        department: { select: { name: true } },
        employee: { select: { name: true } },
      },
    }),
    prisma.complaint.groupBy({
      by: ['departmentId'],
      where: { isDeleted: false },
      _count: { id: true },
    }),
    prisma.complaint.groupBy({
      by: ['categoryId'],
      where: { isDeleted: false },
      _count: { id: true },
    }),
    prisma.complaint.groupBy({
      by: ['status'],
      where: { isDeleted: false },
      _count: { id: true },
    }),
  ]);

  // Enrich department/category data with names
  const departments = await prisma.department.findMany({ select: { id: true, name: true } });
  const categories = await prisma.category.findMany({ select: { id: true, name: true } });

  const deptMap = Object.fromEntries(departments.map((d) => [d.id, d.name]));
  const catMap = Object.fromEntries(categories.map((c) => [c.id, c.name]));

  res.status(200).json({
    status: 'success',
    data: {
      stats: {
        totalComplaints,
        openComplaints,
        inProgressComplaints,
        resolvedComplaints,
        closedComplaints,
        criticalComplaints,
        highComplaints,
        totalUsers,
      },
      recentComplaints,
      charts: {
        byDepartment: byDepartment.map((d) => ({
          name: deptMap[d.departmentId] ?? 'Unknown',
          value: d._count.id,
        })),
        byCategory: byCategory.map((c) => ({
          name: catMap[c.categoryId] ?? 'Unknown',
          value: c._count.id,
        })),
        byStatus: byStatus.map((s) => ({
          name: s.status.replace(/_/g, ' '),
          value: s._count.id,
        })),
      },
    },
  });
});

// ─── GET ALL USERS ────────────────────────────────────────────────────────────
export const getAllUsers = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const search = req.query.search as string | undefined;
  const role = req.query.role as string | undefined;

  const where: any = {};
  if (role) where.role = role;
  if (search) {
    where.OR = [
      { name: { contains: search, mode: 'insensitive' } },
      { email: { contains: search, mode: 'insensitive' } },
      { employeeId: { contains: search, mode: 'insensitive' } },
    ];
  }

  const [users, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        name: true,
        email: true,
        employeeId: true,
        role: true,
        department: { select: { id: true, name: true } },
        createdAt: true,
        _count: { select: { createdComplaints: true, assignedComplaints: true } },
      },
    }),
    prisma.user.count({ where }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      users,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    },
  });
});

// ─── GET AUDIT LOGS ───────────────────────────────────────────────────────────
export const getAuditLogs = asyncHandler(async (req: Request, res: Response) => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 20;
  const action = req.query.action as string | undefined;

  const where: any = {};
  if (action) where.action = { contains: action, mode: 'insensitive' };

  const [logs, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { createdAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    }),
    prisma.auditLog.count({ where }),
  ]);

  res.status(200).json({
    status: 'success',
    data: {
      logs,
      pagination: { total, page, limit, totalPages: Math.ceil(total / limit) },
    },
  });
});

// ─── GET EMPLOYEE STATS (for employee dashboard) ──────────────────────────────
export const getMyStats = asyncHandler(async (req: Request, res: Response) => {
  if (!req.user) throw new CustomError('Not authenticated', 401);

  const employeeId = req.user.id;

  const [total, open, inProgress, resolved] = await Promise.all([
    prisma.complaint.count({ where: { employeeId, isDeleted: false } }),
    prisma.complaint.count({ where: { employeeId, isDeleted: false, status: 'OPEN' } }),
    prisma.complaint.count({ where: { employeeId, isDeleted: false, status: 'IN_PROGRESS' } }),
    prisma.complaint.count({ where: { employeeId, isDeleted: false, status: 'RESOLVED' } }),
  ]);

  res.status(200).json({
    status: 'success',
    data: { stats: { total, open, inProgress, resolved } },
  });
});
