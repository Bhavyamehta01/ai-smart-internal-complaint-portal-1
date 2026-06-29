'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Loader2,
  ShieldCheck,
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardList,
  LogOut,
  RefreshCw,
  Users,
  Activity,
  TrendingUp,
  Eye,
  ChevronRight,
  Search,
  Filter,
  BarChart3,
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts';
import { getAdminDashboard, getAllComplaints } from '@/services/adminApi';
import Link from 'next/link';

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

const CHART_COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#3b82f6', '#10b981', '#f59e0b'];

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AdminDashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [dashboardData, setDashboardData] = useState<any>(null);
  const [complaints, setComplaints] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [activeTab, setActiveTab] = useState<'overview' | 'complaints' | 'users'>('overview');

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
    } else if (!authLoading && user && user.role !== 'ADMIN') {
      router.push('/dashboard');
    }
  }, [user, authLoading, router]);

  const fetchData = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    setError(null);
    try {
      const [dash, complaintsRes] = await Promise.all([
        getAdminDashboard(),
        getAllComplaints({
          limit: 20,
          status: statusFilter || undefined,
          priority: priorityFilter || undefined,
          search: searchQuery || undefined,
        }),
      ]);
      setDashboardData(dash);
      setComplaints(complaintsRes.complaints);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load admin dashboard');
    } finally {
      setLoading(false);
    }
  }, [user, statusFilter, priorityFilter, searchQuery]);

  useEffect(() => {
    if (user && user.role === 'ADMIN') {
      fetchData();
    }
  }, [user, fetchData]);

  if (authLoading || (!dashboardData && loading)) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
          <p className="text-sm text-slate-400 font-light">Loading admin console...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== 'ADMIN') return null;

  const stats = dashboardData?.stats;
  const charts = dashboardData?.charts;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-950 via-slate-950 to-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-purple-500/20 border border-purple-500/30 flex items-center justify-center">
              <ShieldCheck className="w-4 h-4 text-purple-400" />
            </div>
            <span className="font-semibold text-white text-sm">Admin Console</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              {user.name} · <span className="text-purple-400">ADMIN</span>
            </span>
            <button
              onClick={fetchData}
              disabled={loading}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Refresh"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={logout}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Logout"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-8">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
          <p className="text-slate-400 text-sm mt-1">Manage complaints, users, and system analytics</p>
        </div>

        {/* Error */}
        {error && (
          <div className="flex items-center gap-2 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Stats Cards */}
        {stats && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 sm:grid-cols-4 gap-4"
          >
            {[
              { label: 'Total Tickets', value: stats.totalComplaints, icon: ClipboardList, color: 'purple' },
              { label: 'Open', value: stats.openComplaints, icon: AlertCircle, color: 'amber' },
              { label: 'In Progress', value: stats.inProgressComplaints, icon: Clock, color: 'blue' },
              { label: 'Resolved', value: stats.resolvedComplaints, icon: CheckCircle2, color: 'emerald' },
              { label: 'Critical', value: stats.criticalComplaints, icon: Activity, color: 'red' },
              { label: 'High', value: stats.highComplaints, icon: TrendingUp, color: 'orange' },
              { label: 'Closed', value: stats.closedComplaints, icon: CheckCircle2, color: 'slate' },
              { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'indigo' },
            ].map((card) => (
              <div
                key={card.label}
                className="rounded-2xl bg-white/[0.03] border border-white/5 p-5 space-y-3"
              >
                <div className={`w-9 h-9 rounded-xl bg-${card.color}-500/10 flex items-center justify-center`}>
                  <card.icon className={`w-4 h-4 text-${card.color}-400`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-white">{card.value}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{card.label}</p>
                </div>
              </div>
            ))}
          </motion.div>
        )}

        {/* Charts */}
        {charts && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="grid grid-cols-1 lg:grid-cols-2 gap-6"
          >
            {/* By Status Bar Chart */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-6">
                <BarChart3 className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Complaints by Status</h3>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={charts.byStatus}>
                  <XAxis dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} />
                  <YAxis tick={{ fontSize: 10, fill: '#64748b' }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#e2e8f0',
                      fontSize: '12px',
                    }}
                  />
                  <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* By Category Pie Chart */}
            <div className="rounded-2xl bg-white/[0.02] border border-white/5 p-6">
              <div className="flex items-center gap-2 mb-6">
                <Activity className="w-4 h-4 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">Complaints by Category</h3>
              </div>
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie
                      data={charts.byCategory}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={80}
                      dataKey="value"
                      paddingAngle={2}
                    >
                      {charts.byCategory.map((_: any, index: number) => (
                        <Cell key={index} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        backgroundColor: '#0f172a',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        color: '#e2e8f0',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-2">
                  {charts.byCategory.slice(0, 5).map((item: any, i: number) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div
                        className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                        style={{ backgroundColor: CHART_COLORS[i % CHART_COLORS.length] }}
                      />
                      <span className="text-xs text-slate-400 truncate">{item.name}</span>
                      <span className="text-xs text-white font-medium ml-auto">{item.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Complaints Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white flex items-center gap-2">
              <ClipboardList className="w-4 h-4 text-purple-400" />
              All Complaints
            </h2>
            {/* Filters */}
            <div className="flex items-center gap-2 flex-wrap">
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-500" />
                <input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && fetchData()}
                  placeholder="Search tickets..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-white placeholder:text-slate-600 outline-none focus:border-purple-500 w-40"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-slate-300 outline-none focus:border-purple-500"
              >
                <option value="">All Status</option>
                {['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'WAITING_FOR_USER', 'RESOLVED', 'CLOSED', 'REJECTED'].map((s) => (
                  <option key={s} value={s}>{s.replace(/_/g, ' ')}</option>
                ))}
              </select>
              <select
                value={priorityFilter}
                onChange={(e) => setPriorityFilter(e.target.value)}
                className="px-2 py-1.5 text-xs bg-slate-900/60 border border-white/10 rounded-lg text-slate-300 outline-none focus:border-purple-500"
              >
                <option value="">All Priority</option>
                {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <button
                onClick={fetchData}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/20 text-purple-400 text-xs hover:bg-purple-600/30 transition-colors"
              >
                <Filter className="w-3 h-3" />
                Apply
              </button>
            </div>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-6 h-6 animate-spin text-purple-400" />
            </div>
          )}

          {!loading && complaints.length === 0 && (
            <div className="flex items-center justify-center py-12 text-slate-500 text-sm">
              No complaints found matching your criteria.
            </div>
          )}

          {!loading && complaints.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/5">
                    {['Ticket', 'Subject', 'Employee', 'Department', 'Priority', 'Status', 'Date', 'Action'].map(
                      (col) => (
                        <th
                          key={col}
                          className="text-left px-4 py-3 text-slate-500 font-medium"
                        >
                          {col}
                        </th>
                      )
                    )}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {complaints.map((c, i) => (
                    <motion.tr
                      key={c.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: i * 0.02 }}
                      className="hover:bg-white/[0.02] transition-colors"
                    >
                      <td className="px-4 py-3 font-mono text-slate-400">{c.ticketNo}</td>
                      <td className="px-4 py-3 text-white max-w-48 truncate">{c.subject}</td>
                      <td className="px-4 py-3 text-slate-300">{c.employee?.name}</td>
                      <td className="px-4 py-3 text-slate-400">{c.department?.name}</td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${PRIORITY_COLORS[c.priority]}`}>
                          {c.priority}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`px-2 py-0.5 rounded-full border text-[10px] font-medium ${STATUS_COLORS[c.status]}`}>
                          {c.status.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-slate-500">{formatDate(c.createdAt)}</td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/complaints/${c.id}`}
                          className="flex items-center gap-1 px-2 py-1 rounded-lg bg-purple-600/20 text-purple-400 hover:bg-purple-600/30 transition-colors"
                        >
                          <Eye className="w-3 h-3" />
                          Manage
                        </Link>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
