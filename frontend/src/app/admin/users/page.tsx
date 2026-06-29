'use client';

import React, { useState, useEffect, useCallback } from 'react';
import AppLayout from '@/components/layout/AppLayout';
import { useToast } from '@/context/ToastContext';
import { TableRowSkeleton } from '@/components/ui/Skeleton';
import { getAllUsers } from '@/services/adminApi';
import { Users, Search, RefreshCw, Shield, User } from 'lucide-react';
import { format } from 'date-fns';

export default function AdminUsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await getAllUsers({
        page,
        limit: 15,
        search: search || undefined,
      });
      setUsers(res.users || []);
      setTotalPages(res.pagination?.totalPages ?? 1);
    } catch {
      toast('error', 'Failed to load system users.');
    } finally {
      setLoading(false);
    }
  }, [page, search, toast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <AppLayout requiredRole="ADMIN">
      <div className="p-6 max-w-6xl mx-auto w-full space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="page-title">Users List</h1>
            <p className="page-subtitle mt-0.5">Manage registered employees and admin operators</p>
          </div>
          <button onClick={fetchUsers} disabled={loading} className="btn btn-outline btn-sm gap-1.5">
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Users Table */}
        <div className="content-card">
          <div className="section-header flex-col sm:flex-row items-start sm:items-center gap-3">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <h2 className="text-sm font-semibold text-foreground">Registered Accounts</h2>
            </div>
            <div className="relative ml-auto w-full sm:w-48">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && fetchUsers()}
                placeholder="Search name or ID..."
                className="pl-8 pr-3 h-8 text-xs form-input w-full"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Employee ID</th>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Role</th>
                  <th>Department</th>
                  <th>Joined Date</th>
                </tr>
              </thead>
              <tbody>
                {loading
                  ? Array.from({ length: 6 }).map((_, i) => <TableRowSkeleton key={i} cols={6} />)
                  : users.length === 0
                  ? (
                    <tr>
                      <td colSpan={6} className="text-center py-12">
                        <p className="text-sm text-muted-foreground">No accounts found.</p>
                      </td>
                    </tr>
                  )
                  : users.map((u) => (
                    <tr key={u.id}>
                      <td className="font-mono text-xs text-foreground font-medium">{u.employeeId}</td>
                      <td className="text-foreground font-medium">{u.name}</td>
                      <td className="text-muted-foreground">{u.email}</td>
                      <td>
                        <span className={`badge ${
                          u.role === 'ADMIN'
                            ? 'bg-purple-50 text-purple-600 border-purple-100 dark:bg-purple-950/40 dark:text-purple-400 dark:border-purple-900'
                            : 'bg-slate-100 text-slate-600 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700'
                        }`}>
                          {u.role === 'ADMIN' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                          {u.role}
                        </span>
                      </td>
                      <td className="text-muted-foreground">{u.department?.name ?? 'None'}</td>
                      <td className="text-muted-foreground whitespace-nowrap">
                        {format(new Date(u.createdAt), 'dd MMM yyyy')}
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
