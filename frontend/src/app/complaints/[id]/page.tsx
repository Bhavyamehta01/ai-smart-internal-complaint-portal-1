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
} from 'lucide-react';
import { getComplaintById, addComment, Complaint, Comment } from '@/services/complaintApi';
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

const TIMELINE_ICONS: Record<string, React.ReactNode> = {
  ADMIN: <Shield className="w-3.5 h-3.5 text-purple-400" />,
  EMPLOYEE: <User className="w-3.5 h-3.5 text-indigo-400" />,
};

function fmtDate(iso: string) {
  return format(new Date(iso), 'dd MMM yyyy, HH:mm');
}

export default function ComplaintDetailPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const params = useParams();
  const id = params.id as string;

  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [comment, setComment] = useState('');
  const [commenting, setCommenting] = useState(false);

  const fetchComplaint = async () => {
    try {
      setLoading(true);
      const data = await getComplaintById(id);
      setComplaint(data);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load complaint');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (user && id) {
      fetchComplaint();
    }
  }, [authLoading, user, id]);

  const handleAddComment = async () => {
    if (!comment.trim()) return;
    setCommenting(true);
    try {
      const newComment = await addComment(id, comment);
      setComplaint((prev) =>
        prev ? { ...prev, comments: [...(prev.comments || []), newComment] } : prev
      );
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
        <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-400 mx-auto" />
          <p className="text-red-400 text-sm">{error}</p>
          <Link href="/dashboard" className="text-indigo-400 hover:text-indigo-300 text-xs">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <div className="flex items-center gap-2">
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[complaint.priority]}`}
            >
              {complaint.priority}
            </span>
            <span
              className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[complaint.status]}`}
            >
              {complaint.status.replace(/_/g, ' ')}
            </span>
          </div>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <p className="font-mono text-xs text-slate-500">{complaint.ticketNo}</p>
          <h1 className="text-2xl font-bold text-white">{complaint.subject}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
            <span>
              By <span className="text-white">{complaint.employee.name}</span>
            </span>
            <span>·</span>
            <span>{complaint.department.name}</span>
            <span>·</span>
            <span>{complaint.category.name}</span>
            <span>·</span>
            <span>{fmtDate(complaint.createdAt)}</span>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Description */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6"
            >
              <h2 className="text-sm font-semibold text-white mb-4">Description</h2>
              <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>

              {complaint.resolutionNotes && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-medium text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolution Notes
                  </p>
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {complaint.resolutionNotes}
                  </p>
                </div>
              )}

              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <p className="text-xs font-medium text-slate-400 mb-2 flex items-center gap-1.5">
                    <Paperclip className="w-3.5 h-3.5" />
                    Attachments
                  </p>
                  <div className="space-y-1.5">
                    {complaint.attachments.map((url, i) => (
                      <a
                        key={i}
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
                      >
                        <ExternalLink className="w-3 h-3" />
                        Attachment {i + 1}
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </motion.div>

            {/* Comments */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-6"
            >
              <h2 className="text-sm font-semibold text-white mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-indigo-400" />
                Comments ({complaint.comments?.length ?? 0})
              </h2>

              {complaint.comments && complaint.comments.length > 0 ? (
                <div className="space-y-4 mb-6">
                  {complaint.comments.map((c) => (
                    <div
                      key={c.id}
                      className={`p-3.5 rounded-xl border ${
                        c.isInternal
                          ? 'bg-purple-500/5 border-purple-500/15'
                          : 'bg-white/[0.02] border-white/5'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center">
                            {c.user.role === 'ADMIN' ? (
                              <Shield className="w-3 h-3 text-purple-400" />
                            ) : (
                              <User className="w-3 h-3 text-indigo-400" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-white">{c.user.name}</span>
                          {c.isInternal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/20">
                              Internal
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-slate-600">{fmtDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-slate-300 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-500 mb-6">No comments yet.</p>
              )}

              {/* Add Comment */}
              {complaint.status !== 'CLOSED' && complaint.status !== 'REJECTED' && (
                <div className="space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Add a comment..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900/60 border border-white/10 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/30 outline-none text-white text-sm transition-all placeholder:text-slate-600 resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={commenting || !comment.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors disabled:opacity-50"
                    >
                      {commenting ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Send className="w-3.5 h-3.5" />
                      )}
                      Post Comment
                    </button>
                  </div>
                </div>
              )}
            </motion.div>
          </div>

          {/* Sidebar */}
          <div className="space-y-4">
            {/* Details Card */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-5"
            >
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4">
                Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-slate-500">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[complaint.status]}`}
                  >
                    {complaint.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Priority</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[complaint.priority]}`}
                  >
                    {complaint.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Category</span>
                  <span className="text-white">{complaint.category.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Department</span>
                  <span className="text-white">{complaint.department.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Assigned To</span>
                  <span className="text-white">
                    {complaint.assignedEngineer?.name ?? 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-500">Created</span>
                  <span className="text-slate-300">{fmtDate(complaint.createdAt)}</span>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl bg-white/[0.02] border border-white/5 p-5"
            >
              <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Timeline
              </h3>
              <div className="space-y-3">
                {complaint.timelineEvents?.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-slate-800 border border-white/10 flex items-center justify-center flex-shrink-0">
                        {TIMELINE_ICONS[event.user.role] ?? <Clock className="w-3 h-3 text-slate-400" />}
                      </div>
                      {i < (complaint.timelineEvents?.length ?? 0) - 1 && (
                        <div className="w-px flex-1 bg-white/5 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-slate-300 leading-relaxed">{event.message}</p>
                      <p className="text-[10px] text-slate-600 mt-1">{fmtDate(event.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );
}
