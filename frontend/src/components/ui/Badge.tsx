import React from 'react';
import { cn } from '@/lib/utils';

type PriorityLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
type StatusLevel =
  | 'OPEN'
  | 'ASSIGNED'
  | 'IN_PROGRESS'
  | 'WAITING_FOR_USER'
  | 'RESOLVED'
  | 'CLOSED'
  | 'REJECTED';

const PRIORITY_STYLES: Record<PriorityLevel, string> = {
  LOW: 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
  MEDIUM: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  HIGH: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
  CRITICAL: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
};

const STATUS_STYLES: Record<StatusLevel, string> = {
  OPEN: 'bg-blue-50 text-blue-600 border-blue-100 dark:bg-blue-950/40 dark:text-blue-400 dark:border-blue-900',
  ASSIGNED: 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900',
  IN_PROGRESS: 'bg-indigo-50 text-indigo-600 border-indigo-100 dark:bg-indigo-950/40 dark:text-indigo-400 dark:border-indigo-900',
  WAITING_FOR_USER: 'bg-amber-50 text-amber-600 border-amber-100 dark:bg-amber-950/40 dark:text-amber-400 dark:border-amber-900',
  RESOLVED: 'bg-green-50 text-green-600 border-green-100 dark:bg-green-950/40 dark:text-green-400 dark:border-green-900',
  CLOSED: 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800/60 dark:text-slate-400 dark:border-slate-700',
  REJECTED: 'bg-red-50 text-red-600 border-red-100 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900',
};

interface BadgeProps {
  className?: string;
  children: React.ReactNode;
}

export function Badge({ className, children }: BadgeProps) {
  return <span className={cn('badge', className)}>{children}</span>;
}

export function PriorityBadge({ priority }: { priority: string }) {
  const style = PRIORITY_STYLES[priority as PriorityLevel] ?? PRIORITY_STYLES.LOW;
  return <span className={cn('badge', style)}>{priority}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status as StatusLevel] ?? STATUS_STYLES.OPEN;
  const label = status.replace(/_/g, ' ');
  return <span className={cn('badge', style)}>{label}</span>;
}
