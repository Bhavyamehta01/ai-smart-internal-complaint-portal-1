'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter, useParams } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Loader2,
  ArrowLeft,
  MessageSquare,
  Clock,
  AlertCircle,
  CheckCircle2,
  Paperclip,
  ExternalLink,
  Send,
  User,
  Shield,
  UserCheck,
  RefreshCw,
} from 'lucide-react';
import {
  getAdminComplaintById,
  updateComplaintStatus,
  assignComplaint,
  addAdminComment,
  getAllUsers,
} from '@/services/adminApi';
import Link from 'next/link';
import { format } from 'date-fns';

const PRIORITY_COLORS: Record<string, string> = {
  LOW: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  MEDIUM: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  HIGH: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  CRITICAL: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-indigo-500/20 text-indigo-300 border-indigo-500/30',
  ASSIGNED: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
  IN_PROGRESS: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
  WAITING_FOR_USER: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
  RESOLVED: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
  CLOSED: 'bg-slate-500/20 text-slate-300 border-slate-500/30',
  REJECTED: 'bg-red-500/20 text-red-300 border-red-500/30',
};

const ALL_STATUSES = [
  'OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED', 'REJECTED',
];

function fmtDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, HH:mm');
}

export default function AdminComplaintDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [complaint, setComplaint] = useState<any | null>(null);
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Action states
  const [comment, setComment] = useState('');
  const [isInternal, setIsInternal] = useState(false);
  const [commenting, setCommenting] = useState(false);
  const [newStatus, setNewStatus] = useState('');
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [selectedEngineer, setSelectedEngineer] = useState('');
  const [assigning, setAssigning] = useState(false);

  const fetchAll = async () => {
    setLoading(true);
    try {
      const [comp, usersRes] = await Promise.all([
        getAdminComplaintById(id),
        getAllUsers({ limit: 50 }),
      ]);
      setComplaint(comp);
      setUsers(usersRes.users || []);
      setNewStatus(comp.status);
      setSelectedEngineer(comp.assignedEngineer?.id ?? '');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) { router.push('/login'); return; }
    if (!authLoading && user && user.role !== 'ADMIN') { router.push('/dashboard'); return; }
    if (user) fetchAll();
  }, [authLoading, user]);

  const handleStatusUpdate = async () => {
    setUpdatingStatus(true);
    try {
      await updateComplaintStatus(id, newStatus, resolutionNotes || undefined);
      await fetchAll();
      setResolutionNotes('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssign = async () => {
    if (!selectedEngineer) return;
    setAssigning(true);
    try {
      await assignComplaint(id, selectedEngineer);
      await fetchAll();
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to assign complaint');
    } finally {
      setAssigning(false);
    }
  };

  const handleComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      await addAdminComment(id, comment, isInternal);
      await fetchAll();
      setComment('');
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to add comment');
    } finally {
      setCommenting(false);
    }
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
      </div>
    );
  }

  if (error && !complaint) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-red-400 text-sm">{error}</p>
          <Link href="/admin/dashboard" className="text-purple-400 hover:text-purple-300 text-xs">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-slate-950 to-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/admin/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Admin
          </Link>
          <div className="flex items-center gap-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[complaint.priority]}`}>
              {complaint.priority}
            </span>
            <span className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[complaint.status]}`}>
              {complaint.status.replace(/_/g, ' ')}
            </span>
            <button
              onClick={fetchAll}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {error && (
          <div className="flex items-center gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Title */}
        <div>
          <p className="font-mono text-xs text-slate-500 mb-1">{complaint.ticketNo}</p>
          <h1 className="text-xl font-bold text-white">{complaint.subject}</h1>
          <div className="flex flex-wrap items-center gap-2 mt-2 text-xs text-slate-400">
            <span>By <span className="text-white">{complaint.employee?.name}</span> ({complaint.employee?.employeeId})</span>
            <span>·</span>
            <span>{complaint.department?.name}</span>
            <span>·</span>
            <span>{complaint.category?.name}</span>
            <span>·</span>
            <span>{fmtDate(complaint.createdAt)}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left: Description + Comments */}
          <div className="lg:col-span-2 space-y-5">
            {/* Description */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h2 className="text-sm font-semibold text-white mb-3">Description</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>
              {complaint.resolutionNotes && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" /> Resolution Notes
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">{complaint.resolutionNotes}</p>
                </div>
              )}
              {complaint.attachments?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" /> Attachments
                  </p>
                  {complaint.attachments.map((url: string, i: number) => (
                    <a key={i} href={url} target="_blank" rel="noopener noreferrer"
                      className="flex items-center gap-1.5 text-xs text-purple-400 hover:text-purple-300 transition-colors mb-1">
                      <ExternalLink className="w-3 h-3" /> Attachment {i + 1}
                    </a>
                  ))}
                </div>
              )}
            </div>

            {/* Comments */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-purple-400" />
                Comments ({complaint.comments?.length ?? 0})
              </h2>
              {complaint.comments?.length > 0 ? (
                <div className="space-y-3 mb-5">
                  {complaint.comments.map((c: any) => (
                    <div key={c.id}
                      className={`p-3.5 rounded-xl border ${c.isInternal ? 'bg-purple-500/5 border-purple-500/15' : 'bg-white/[0.02] border-white/5'}`}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-5 h-5 rounded-full bg-slate-800 flex items-center justify-center">
                            {c.user.role === 'ADMIN' ? <Shield className="w-2.5 h-2.5 text-purple-400" /> : <User className="w-2.5 h-2.5 text-indigo-400" />}
                          </div>
                          <span className="text-xs font-medium text-white">{c.user.name}</span>
                          {c.isInternal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20">Internal</span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600">{fmtDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mb-4">No comments yet.</p>
              )}

              {/* Add Comment */}
              <div className="space-y-2">
                <textarea
                  value={comment}
                  onChange={(e) => setComment(e.target.value)}
                  rows={3}
                  placeholder="Add a comment..."
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30 outline-none text-white text-sm transition-all placeholder:text-slate-600 resize-none"
                />
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={isInternal}
                      onChange={(e) => setIsInternal(e.target.checked)}
                      className="rounded border-white/20 bg-slate-900"
                    />
                    Internal note (not visible to employee)
                  </label>
                  <button
                    onClick={handleComment}
                    disabled={commenting || !comment.trim()}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                  >
                    {commenting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Actions + Timeline */}
          <div className="space-y-4">
            {/* Status Update */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Update Status
              </h3>
              <select
                value={newStatus}
                onChange={(e) => setNewStatus(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 focus:border-purple-500 outline-none text-sm text-white mb-3"
              >
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              {(newStatus === 'RESOLVED' || newStatus === 'CLOSED') && (
                <textarea
                  value={resolutionNotes}
                  onChange={(e) => setResolutionNotes(e.target.value)}
                  rows={2}
                  placeholder="Resolution notes..."
                  className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 focus:border-purple-500 outline-none text-sm text-white transition-all placeholder:text-slate-600 resize-none mb-3"
                />
              )}
              <button
                onClick={handleStatusUpdate}
                disabled={updatingStatus || newStatus === complaint.status}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {updatingStatus ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                Update Status
              </button>
            </div>

            {/* Assign */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5" />
                Assign Engineer
              </h3>
              <select
                value={selectedEngineer}
                onChange={(e) => setSelectedEngineer(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-slate-900/60 border border-white/10 focus:border-purple-500 outline-none text-sm text-white mb-3"
              >
                <option value="">Select engineer</option>
                {users.map((u: any) => (
                  <option key={u.id} value={u.id}>
                    {u.name} ({u.role})
                  </option>
                ))}
              </select>
              <button
                onClick={handleAssign}
                disabled={assigning || !selectedEngineer}
                className="w-full flex items-center justify-center gap-2 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
              >
                {assigning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserCheck className="w-3.5 h-3.5" />}
                Assign
              </button>
            </div>

            {/* Details */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">Details</h3>
              <div className="space-y-2.5 text-xs">
                {[
                  ['Category', complaint.category?.name],
                  ['Department', complaint.department?.name],
                  ['Submitter', `${complaint.employee?.name} (${complaint.employee?.employeeId})`],
                  ['Assigned To', complaint.assignedEngineer?.name ?? 'Unassigned'],
                  ['Created', fmtDate(complaint.createdAt)],
                  ['Updated', fmtDate(complaint.updatedAt)],
                ].map(([label, value]) => (
                  <div key={label} className="flex justify-between gap-2">
                    <span className="text-slate-500">{label}</span>
                    <span className="text-white text-right">{value}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Timeline */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-5">
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Timeline
              </h3>
              <div className="space-y-3">
                {complaint.timelineEvents?.map((event: any, i: number) => (
                  <div key={event.id} className="flex gap-2.5">
                    <div className="flex flex-col items-center">
                      <div className="w-5 h-5 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                        {event.user.role === 'ADMIN' ? (
                          <Shield className="w-2.5 h-2.5 text-purple-400" />
                        ) : (
                          <User className="w-2.5 h-2.5 text-indigo-400" />
                        )}
                      </div>
                      {i < (complaint.timelineEvents?.length ?? 0) - 1 && (
                        <div className="w-px flex-1 bg-white/5 mt-1" />
                      )}
                    </div>
                    <div className="pb-2.5">
                      <p className="text-xs text-slate-300">{event.message}</p>
                      <p className="text-[10px] text-slate-600 mt-0.5">{fmtDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
