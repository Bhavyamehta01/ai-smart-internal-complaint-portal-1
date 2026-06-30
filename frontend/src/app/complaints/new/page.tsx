'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Loader2,
  ArrowLeft,
  Paperclip,
  X,
  Bot,
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  AlertCircle,
  Upload,
} from 'lucide-react';
import { getReferenceData, createComplaint, ReferenceData } from '@/services/complaintApi';
import { classifyComplaint, findDuplicates } from '@/services/aiApi';
import Link from 'next/link';

const schema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters').max(200),
  description: z.string().min(20, 'Description must be at least 20 characters').max(5000),
  categoryId: z.string().uuid('Please select a category'),
  departmentId: z.string().uuid('Please select a department'),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']).optional(),
});

type FormValues = z.infer<typeof schema>;

const PRIORITY_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  LOW: { bg: 'bg-slate-500/10 dark:bg-slate-500/20', text: 'text-slate-600 dark:text-slate-300', border: 'border-slate-500/30' },
  MEDIUM: { bg: 'bg-blue-500/10 dark:bg-blue-500/20', text: 'text-blue-600 dark:text-blue-300', border: 'border-blue-500/30' },
  HIGH: { bg: 'bg-amber-500/10 dark:bg-amber-500/20', text: 'text-amber-600 dark:text-amber-300', border: 'border-amber-500/30' },
  CRITICAL: { bg: 'bg-red-500/10 dark:bg-red-500/20', text: 'text-red-600 dark:text-red-300', border: 'border-red-500/30' },
};

export default function NewComplaintPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  const [refData, setRefData] = useState<ReferenceData | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // AI state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult, setAiResult] = useState<{
    category: string;
    categoryId: string | null;
    priority: string;
    summary: string;
  } | null>(null);
  const [duplicates, setDuplicates] = useState<any[]>([]);
  const classifyTimeout = useRef<NodeJS.Timeout | null>(null);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
  });

  const subject = watch('subject');
  const description = watch('description');

  // Load reference data
  useEffect(() => {
    if (user) {
      getReferenceData().then(setRefData).catch(console.error);
    }
  }, [user]);

  // Pre-fill department
  useEffect(() => {
    if (refData && user) {
      const dept = refData.departments.find((d) => d.name === user.department);
      if (dept) setValue('departmentId', dept.id);
    }
  }, [refData, user, setValue]);

  // Auto-classify with debounce
  useEffect(() => {
    if (!subject || !description || subject.length < 5 || description.length < 20) return;

    if (classifyTimeout.current) clearTimeout(classifyTimeout.current);
    classifyTimeout.current = setTimeout(async () => {
      setAiLoading(true);
      try {
        const [classification, dupResult] = await Promise.all([
          classifyComplaint(subject, description),
          findDuplicates(subject, description),
        ]);
        setAiResult(classification);
        setDuplicates(dupResult.duplicates || []);

        if (classification.categoryId) {
          setValue('categoryId', classification.categoryId);
        }
        setValue('priority', classification.priority as any);
      } catch {
        // Silently fail AI classification
      } finally {
        setAiLoading(false);
      }
    }, 1000);

    return () => {
      if (classifyTimeout.current) clearTimeout(classifyTimeout.current);
    };
  }, [subject, description, setValue]);

  useEffect(() => {
    if (!authLoading && !user) router.push('/login');
  }, [authLoading, user, router]);

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files).slice(0, 5 - files.length);
      setFiles((prev) => [...prev, ...newFiles].slice(0, 5));
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: FormValues) => {
    setSubmitting(true);
    setError(null);
    try {
      await createComplaint({
        ...data,
        files: files.length > 0 ? files : undefined,
      });
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 2000);
    } catch (err: any) {
      setError(err?.response?.data?.message || err?.message || 'Failed to submit complaint');
    } finally {
      setSubmitting(false);
    }
  };

  if (authLoading || !refData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center space-y-4"
        >
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8 text-emerald-500" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">Complaint Submitted!</h2>
          <p className="text-muted-foreground text-sm">Your ticket has been created. Redirecting to dashboard...</p>
          <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <Link
            href="/dashboard"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors text-sm"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Dashboard
          </Link>
          <h1 className="text-sm font-semibold text-foreground">New Complaint</h1>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Form */}
          <div className="lg:col-span-2">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl bg-card border border-border p-6 space-y-6 shadow-sm"
            >
              <div>
                <h2 className="text-lg font-semibold text-foreground">Submit a Complaint</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Our AI will automatically classify your complaint as you type.
                </p>
              </div>

              {error && (
                <div className="flex items-start gap-2 p-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Subject */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Subject *</label>
                  <input
                    {...register('subject')}
                    placeholder="Brief description of the issue"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground text-sm transition-all placeholder:text-muted-foreground"
                  />
                  {errors.subject && (
                    <p className="text-xs text-red-500">{errors.subject.message}</p>
                  )}
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">Description *</label>
                  <textarea
                    {...register('description')}
                    rows={5}
                    placeholder="Provide detailed information about the issue, including when it started and what steps you've already tried..."
                    className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input focus:border-primary focus:ring-1 focus:ring-primary/30 outline-none text-foreground text-sm transition-all placeholder:text-muted-foreground resize-none"
                  />
                  {errors.description && (
                    <p className="text-xs text-red-500">{errors.description.message}</p>
                  )}
                </div>

                {/* Category + Department */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Category *</label>
                    <select
                      {...register('categoryId')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm text-foreground transition-all"
                    >
                      <option value="">Select category</option>
                      {refData.categories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.name}
                        </option>
                      ))}
                    </select>
                    {errors.categoryId && (
                      <p className="text-xs text-red-500">{errors.categoryId.message}</p>
                    )}
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-foreground">Department *</label>
                    <select
                      {...register('departmentId')}
                      className="w-full px-3.5 py-2.5 rounded-xl bg-background border border-input focus:border-primary outline-none text-sm text-foreground transition-all"
                    >
                      <option value="">Select department</option>
                      {refData.departments.map((d) => (
                        <option key={d.id} value={d.id}>
                          {d.name}
                        </option>
                      ))}
                    </select>
                    {errors.departmentId && (
                      <p className="text-xs text-red-500">{errors.departmentId.message}</p>
                    )}
                  </div>
                </div>

                {/* Priority */}
                <div className="space-y-1.5">
                  <label className="text-xs font-medium text-foreground">
                    Priority <span className="text-muted-foreground">(AI-suggested, adjustable)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    {(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'] as const).map((p) => (
                      <button
                        type="button"
                        key={p}
                        onClick={() => setValue('priority', p)}
                        className={`flex-1 py-2 rounded-xl border text-xs font-medium transition-all ${
                          watch('priority') === p
                            ? `${PRIORITY_STYLES[p].bg} ${PRIORITY_STYLES[p].text} ${PRIORITY_STYLES[p].border} ring-1 ring-current/30`
                            : 'bg-transparent border-border text-muted-foreground hover:border-border/80 hover:text-foreground'
                        }`}
                      >
                        {p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* File Upload */}
                <div className="space-y-2">
                  <label className="text-xs font-medium text-foreground">
                    Attachments <span className="text-muted-foreground">(max 5 files, 10MB each)</span>
                  </label>
                  <label className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-dashed border-border hover:border-primary/40 text-muted-foreground hover:text-primary text-xs cursor-pointer transition-all">
                    <Upload className="w-4 h-4" />
                    Click to attach files
                    <input
                      type="file"
                      multiple
                      accept="image/*,.pdf,.doc,.docx,.xls,.xlsx"
                      onChange={onFileChange}
                      className="hidden"
                    />
                  </label>
                  {files.length > 0 && (
                    <div className="space-y-1.5">
                      {files.map((file, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between px-3 py-2 rounded-lg bg-muted/30 border border-border"
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <Paperclip className="w-3.5 h-3.5 text-muted-foreground flex-shrink-0" />
                            <span className="text-xs text-foreground truncate">{file.name}</span>
                            <span className="text-xs text-muted-foreground flex-shrink-0">
                              ({(file.size / 1024).toFixed(0)}KB)
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={() => removeFile(i)}
                            className="text-muted-foreground hover:text-red-500 transition-colors"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-semibold text-sm shadow-sm transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:-translate-y-0.5 active:translate-y-0"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Submitting...
                    </>
                  ) : (
                    'Submit Complaint'
                  )}
                </button>
              </form>
            </motion.div>
          </div>

          {/* AI Panel */}
          <div className="space-y-4">
            {/* AI Classification */}
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              className="rounded-2xl bg-card border border-border p-5 shadow-sm"
            >
              <div className="flex items-center gap-2 mb-4">
                <Bot className="w-4 h-4 text-primary" />
                <h3 className="text-sm font-semibold text-foreground">AI Classification</h3>
                {aiLoading && <Loader2 className="w-3.5 h-3.5 animate-spin text-primary ml-auto" />}
              </div>

              {!aiResult && !aiLoading && (
                <p className="text-xs text-muted-foreground">
                  Start typing a subject and description — AI will auto-classify your complaint.
                </p>
              )}

              <AnimatePresence>
                {aiResult && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-3"
                  >
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Predicted Category
                      </p>
                      <div className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-primary/10 border border-primary/20">
                        <Sparkles className="w-3.5 h-3.5 text-primary" />
                        <span className="text-xs text-primary font-medium">{aiResult.category}</span>
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">
                        Predicted Priority
                      </p>
                      <div
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs font-medium ${
                          PRIORITY_STYLES[aiResult.priority]?.bg
                        } ${PRIORITY_STYLES[aiResult.priority]?.text} ${
                          PRIORITY_STYLES[aiResult.priority]?.border
                        }`}
                      >
                        {aiResult.priority}
                      </div>
                    </div>

                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">AI Summary</p>
                      <p className="text-xs text-foreground/80 leading-relaxed">{aiResult.summary}</p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>

            {/* Duplicate Detection */}
            <AnimatePresence>
              {duplicates.length > 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="rounded-2xl bg-amber-500/5 border border-amber-500/20 p-5"
                >
                  <div className="flex items-center gap-2 mb-3">
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                    <h3 className="text-sm font-semibold text-amber-600 dark:text-amber-300">
                      Similar Tickets Found
                    </h3>
                  </div>
                  <p className="text-xs text-amber-600/70 dark:text-amber-300/70 mb-3">
                    The following existing tickets appear similar to your complaint:
                  </p>
                  <div className="space-y-2">
                    {duplicates.map((d: any) => (
                      <div
                        key={d.ticketNo}
                        className="px-3 py-2 rounded-lg bg-amber-500/5 border border-amber-500/10"
                      >
                        <p className="font-mono text-xs text-amber-600 dark:text-amber-400">{d.ticketNo}</p>
                        <p className="text-xs text-foreground/70 truncate">{d.subject}</p>
                        <p className="text-[10px] text-muted-foreground">
                          {Math.round(d.similarity * 100)}% similar
                        </p>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-amber-600/60 dark:text-amber-300/60 mt-3">
                    Consider reviewing these before submitting a new ticket.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Tips */}
            <div className="rounded-2xl bg-card border border-border p-5 shadow-sm">
              <h3 className="text-xs font-semibold text-foreground mb-3">Tips for faster resolution</h3>
              <ul className="space-y-2 text-xs text-muted-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Include specific error messages or codes
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Mention when the issue first appeared
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  List steps you have already tried
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-primary mt-0.5">✓</span>
                  Attach screenshots if possible
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
