'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/context/ToastContext';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { getAuditLogs } from '@/services/adminApi';
import { FileText, RefreshCw } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminAuditLogsPage() {
  const { toast } = useToast();
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAuditLogs({ page, limit: 15 });
      setLogs(res.logs || []);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      toast('error', 'Failed to load system audit logs.');
    } finally {
      setLoading(false);
    }
  }, [page, toast]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  return (
    <AppLayout requiredRole="ADMIN">
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Audit Logs</h1>
            <p className="page-subtitle mt-0.5">Review chronological sequence of system actions and user logins</p>
          </div>
          <button onClick={fetchLogs} disabled={loading} className="btn btn-outline btn-sm gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Logs Table */}
        <div className="content-card">
          <div className="section-header">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Action Timeline</h2>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Action</th>
                  <th>User ID</th>
                  <th>IP Address</th>
                  <th>Context Details</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={5} />)
                  : logs.length === 0
                  ? (
                    <tr>
                      <td colSpan={5} className="text-center py-12">
                        <p className="text-sm text-muted-foreground">No audit logs recorded.</p>
                      </td>
                    </tr>
                  )
                  : logs.map((l) => (
                    <tr key={l.id} className="text-xs">
                      <td className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(l.createdAt), 'dd MMM yyyy, HH:mm:ss')}
                      </td>
                      <td className="font-semibold text-foreground">{l.action}</td>
                      <td className="font-mono text-muted-foreground">{l.userId}</td>
                      <td className="font-mono text-muted-foreground">{l.ipAddress ?? '127.0.0.1'}</td>
                      <td className="max-w-xs truncate text-muted-foreground" title={l.details}>
                        {l.details}
                      </td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t border-border">
              <p className="text-xs text-muted-foreground">Page {page} of {totalPages}</p>
              <div className="flex items-center gap-1">
                <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page <= 1} className="btn btn-outline btn-sm">Previous</button>
                <button onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page >= totalPages} className="btn btn-outline btn-sm">Next</button>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppLayout>
  );
}
