import { api } from './api';

export const getAdminDashboard = async () => {
  const res = await api.get('/admin/dashboard');
  return res.data.data;
};

export const getAllComplaints = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
  departmentId?: string;
  search?: string;
}) => {
  const res = await api.get('/admin/complaints', { params });
  return res.data.data;
};

export const getAdminComplaintById = async (id: string) => {
  const res = await api.get(`/admin/complaints/${id}`);
  return res.data.data.complaint;
};

export const updateComplaintStatus = async (
  id: string,
  status: string,
  resolutionNotes?: string
) => {
  const res = await api.patch(`/admin/complaints/${id}/status`, { status, resolutionNotes });
  return res.data.data.complaint;
};

export const assignComplaint = async (id: string, assignedEngineerId: string) => {
  const res = await api.patch(`/admin/complaints/${id}/assign`, { assignedEngineerId });
  return res.data.data.complaint;
};

export const addAdminComment = async (
  complaintId: string,
  content: string,
  isInternal = false
) => {
  const res = await api.post(`/admin/complaints/${complaintId}/comments`, { content, isInternal });
  return res.data.data.comment;
};

export const deleteComplaint = async (id: string) => {
  await api.delete(`/admin/complaints/${id}`);
};

export const getAllUsers = async (params?: {
  page?: number;
  limit?: number;
  search?: string;
  role?: string;
}) => {
  const res = await api.get('/admin/users', { params });
  return res.data.data;
};

export const getAuditLogs = async (params?: { page?: number; limit?: number }) => {
  const res = await api.get('/admin/audit-logs', { params });
  return res.data.data;
};
