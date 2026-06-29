import { api } from './api';

export interface Complaint {
  id: string;
  ticketNo: string;
  subject: string;
  description: string;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  status: 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'WAITING_FOR_USER' | 'RESOLVED' | 'CLOSED' | 'REJECTED';
  attachments: string[];
  resolutionNotes?: string;
  category: { id: string; name: string };
  department: { id: string; name: string };
  employee: { id: string; name: string; employeeId: string; email?: string };
  assignedEngineer?: { id: string; name: string; employeeId: string } | null;
  comments?: Comment[];
  timelineEvents?: TimelineEvent[];
  createdAt: string;
  updatedAt: string;
  _count?: { comments: number };
}

export interface Comment {
  id: string;
  content: string;
  isInternal: boolean;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

export interface TimelineEvent {
  id: string;
  message: string;
  createdAt: string;
  user: { id: string; name: string; role: string };
}

export interface ReferenceData {
  departments: { id: string; name: string }[];
  categories: { id: string; name: string }[];
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: { total: number; page: number; limit: number; totalPages: number };
}

// Get reference data (departments + categories) for forms
export const getReferenceData = async (): Promise<ReferenceData> => {
  const res = await api.get('/employees/reference');
  return res.data.data;
};

// Get employee's own complaints
export const getMyComplaints = async (params?: {
  page?: number;
  limit?: number;
  status?: string;
  priority?: string;
}): Promise<{ complaints: Complaint[]; pagination: any }> => {
  const res = await api.get('/employees/complaints', { params });
  return res.data.data;
};

// Get my stats
export const getMyStats = async () => {
  const res = await api.get('/employees/my-stats');
  return res.data.data.stats;
};

// Get single complaint
export const getComplaintById = async (id: string): Promise<Complaint> => {
  const res = await api.get(`/employees/complaints/${id}`);
  return res.data.data.complaint;
};

// Create complaint (with optional file attachments)
export const createComplaint = async (data: {
  subject: string;
  description: string;
  categoryId: string;
  departmentId: string;
  priority?: string;
  files?: File[];
}): Promise<Complaint> => {
  const formData = new FormData();
  formData.append('subject', data.subject);
  formData.append('description', data.description);
  formData.append('categoryId', data.categoryId);
  formData.append('departmentId', data.departmentId);
  if (data.priority) formData.append('priority', data.priority);
  if (data.files) {
    data.files.forEach((file) => formData.append('attachments', file));
  }

  const res = await api.post('/employees/complaints', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return res.data.data.complaint;
};

// Add comment to complaint
export const addComment = async (
  complaintId: string,
  content: string,
  isInternal = false
): Promise<Comment> => {
  const res = await api.post(`/employees/complaints/${complaintId}/comments`, {
    content,
    isInternal,
  });
  return res.data.data.comment;
};
