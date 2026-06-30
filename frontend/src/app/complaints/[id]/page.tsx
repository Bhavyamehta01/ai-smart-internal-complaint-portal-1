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
  LOW: 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30',
  MEDIUM: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  HIGH: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  CRITICAL: 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
};

const STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-indigo-500/10 text-indigo-600 border-indigo-500/20 dark:bg-indigo-500/20 dark:text-indigo-300 dark:border-indigo-500/30',
  ASSIGNED: 'bg-purple-500/10 text-purple-600 border-purple-500/20 dark:bg-purple-500/20 dark:text-purple-300 dark:border-purple-500/30',
  IN_PROGRESS: 'bg-blue-500/10 text-blue-600 border-blue-500/20 dark:bg-blue-500/20 dark:text-blue-300 dark:border-blue-500/30',
  WAITING_FOR_USER: 'bg-amber-500/10 text-amber-600 border-amber-500/20 dark:bg-amber-500/20 dark:text-amber-300 dark:border-amber-500/30',
  RESOLVED: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20 dark:bg-emerald-500/20 dark:text-emerald-300 dark:border-emerald-500/30',
  CLOSED: 'bg-slate-500/10 text-slate-500 border-slate-500/20 dark:bg-slate-500/20 dark:text-slate-300 dark:border-slate-500/30',
  REJECTED: 'bg-red-500/10 text-red-600 border-red-500/20 dark:bg-red-500/20 dark:text-red-300 dark:border-red-500/30',
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
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center space-y-3">
          <AlertCircle className="w-8 h-8 text-red-500 mx-auto" />
          <p className="text-red-500 text-sm">{error}</p>
          <Link href="/dashboard" className="text-primary hover:text-primary/80 text-xs">
            ← Back to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  if (!complaint) return null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
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
          <p className="font-mono text-xs text-muted-foreground">{complaint.ticketNo}</p>
          <h1 className="text-2xl font-bold text-foreground">{complaint.subject}</h1>
          <div className="flex flex-wrap items-center gap-3 text-xs text-muted-foreground">
            <span>
              By <span className="text-foreground font-medium">{complaint.employee.name}</span>
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
              className="rounded-2xl bg-card border border-border p-6 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-foreground mb-4">Description</h2>
              <p className="text-sm text-foreground/80 leading-relaxed whitespace-pre-wrap">
                {complaint.description}
              </p>

              {complaint.resolutionNotes && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-emerald-600 dark:text-emerald-400 mb-2 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Resolution Notes
                  </p>
                  <p className="text-sm text-foreground/80 leading-relaxed">
                    {complaint.resolutionNotes}
                  </p>
                </div>
              )}

              {complaint.attachments && complaint.attachments.length > 0 && (
                <div className="mt-4 pt-4 border-t border-border">
                  <p className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5">
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
                        className="flex items-center gap-2 text-xs text-primary hover:text-primary/80 transition-colors"
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
              className="rounded-2xl bg-card border border-border p-6 shadow-sm"
            >
              <h2 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-primary" />
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
                          : 'bg-muted/30 border-border'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
                            {c.user.role === 'ADMIN' ? (
                              <Shield className="w-3 h-3 text-primary" />
                            ) : (
                              <User className="w-3 h-3 text-primary" />
                            )}
                          </div>
                          <span className="text-xs font-medium text-foreground">{c.user.name}</span>
                          {c.isInternal && (
                            <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20">
                              Internal
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] text-muted-foreground">{fmtDate(c.createdAt)}</span>
                      </div>
                      <p className="text-xs text-foreground/80 leading-relaxed">{c.content}</p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-muted-foreground mb-6">No comments yet.</p>
              )}

              {/* Add Comment */}
              {complaint.status !== 'CLOSED' && complaint.status !== 'REJECTED' && (
                <div className="space-y-2">
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    rows={3}
                    placeholder="Add a comment..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground text-sm transition-all placeholder:text-muted-foreground resize-none"
                  />
                  <div className="flex justify-end">
                    <button
                      onClick={handleAddComment}
                      disabled={commenting || !comment.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-medium transition-colors disabled:opacity-50"
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
              className="rounded-2xl bg-card border border-border p-5 shadow-sm"
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4">
                Details
              </h3>
              <div className="space-y-3 text-xs">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Status</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-medium ${STATUS_COLORS[complaint.status]}`}
                  >
                    {complaint.status.replace(/_/g, ' ')}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Priority</span>
                  <span
                    className={`px-2 py-0.5 rounded-full border font-medium ${PRIORITY_COLORS[complaint.priority]}`}
                  >
                    {complaint.priority}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Category</span>
                  <span className="text-foreground">{complaint.category.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="text-foreground">{complaint.department.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Assigned To</span>
                  <span className="text-foreground">
                    {complaint.assignedEngineer?.name ?? 'Unassigned'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Created</span>
                  <span className="text-foreground">{fmtDate(complaint.createdAt)}</span>
                </div>
              </div>
            </motion.div>

            {/* Timeline */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-2xl bg-card border border-border p-5 shadow-sm"
            >
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-4 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                Timeline
              </h3>
              <div className="space-y-3">
                {complaint.timelineEvents?.map((event, i) => (
                  <div key={event.id} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-6 h-6 rounded-full bg-muted border border-border flex items-center justify-center flex-shrink-0">
                        {event.user.role === 'ADMIN' ? (
                          <Shield className="w-3 h-3 text-primary" />
                        ) : (
                          <User className="w-3 h-3 text-primary" />
                        )}
                      </div>
                      {i < (complaint.timelineEvents?.length ?? 0) - 1 && (
                        <div className="w-px flex-1 bg-border mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs text-foreground/80 leading-relaxed">{event.message}</p>
                      <p className="text-[10px] text-muted-foreground mt-1">{fmtDate(event.createdAt)}</p>
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
