'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Loader2,
  Plus,
  AlertCircle,
  CheckCircle2,
  Clock,
  ClipboardList,
  LogOut,
  RefreshCw,
  ChevronRight,
  Bot,
  X,
  Send,
  Paperclip,
  FileText,
  Eye,
  Wifi,
  HardDrive,
  Shield,
  Cpu,
} from 'lucide-react';
import { getMyComplaints, getMyStats, Complaint } from '@/services/complaintApi';
import { sendChatMessage } from '@/services/aiApi';
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

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

// ─── Chat Widget ──────────────────────────────────────────────────────────────

interface ChatMsg {
  role: 'user' | 'bot';
  text: string;
}

function ChatWidget({ onClose }: { onClose: () => void }) {
  const [messages, setMessages] = useState<ChatMsg[]>([
    { role: 'bot', text: 'Hello! I\'m your IT Support Assistant. How can I help you today?' },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const bottomRef = React.useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const send = async () => {
    if (!input.trim()) return;
    const text = input;
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', text }]);
    setLoading(true);
    try {
      const res = await sendChatMessage(text);
      setMessages((prev) => [...prev, { role: 'bot', text: res.message }]);
    } catch {
      setMessages((prev) => [...prev, { role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 20, scale: 0.95 }}
      className="fixed bottom-24 right-6 w-80 z-50 rounded-2xl bg-slate-900 border border-white/10 shadow-2xl flex flex-col overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-600/30 to-purple-600/30 border-b border-white/10">
        <div className="flex items-center gap-2">
          <Bot className="w-4 h-4 text-indigo-400" />
          <span className="text-sm font-semibold text-white">IT Support Assistant</span>
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        </div>
        <button onClick={onClose} className="text-slate-400 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 max-h-72">
        {messages.map((msg, i) => (
          <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[80%] text-xs rounded-xl px-3 py-2 leading-relaxed ${
                msg.role === 'user'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-slate-800 text-slate-200 border border-white/5'
              }`}
            >
              {msg.text}
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex justify-start">
            <div className="bg-slate-800 border border-white/5 rounded-xl px-3 py-2">
              <Loader2 className="w-3 h-3 text-indigo-400 animate-spin" />
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-white/10">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && send()}
            placeholder="Ask me anything..."
            className="flex-1 text-xs bg-slate-800 border border-white/10 rounded-lg px-3 py-2 text-white placeholder:text-slate-500 outline-none focus:border-indigo-500"
          />
          <button
            onClick={send}
            disabled={loading || !input.trim()}
            className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors disabled:opacity-50"
          >
            <Send className="w-3 h-3" />
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── Status Filter Tabs ───────────────────────────────────────────────────────

const STATUS_TABS = ['All', 'OPEN', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'];

// ─── Main Dashboard Component ─────────────────────────────────────────────────

export default function DashboardPage() {
  const { user, loading: authLoading, logout } = useAuth();
  const router = useRouter();

  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ total: 0, open: 0, inProgress: 0, resolved: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('All');
  const [chatOpen, setChatOpen] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [complaintsRes, statsRes] = await Promise.all([
        getMyComplaints({
          limit: 20,
          status: activeTab !== 'All' ? activeTab : undefined,
        }),
        getMyStats(),
      ]);
      setComplaints(complaintsRes.complaints);
      setStats(statsRes);
    } catch (err: any) {
      setError(err?.response?.data?.message || 'Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/login');
      return;
    }
    if (!authLoading && user) {
      fetchData();
    }
  }, [authLoading, user, router, fetchData]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-400" />
          <p className="text-sm text-slate-400 font-light">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-950 via-slate-950 to-black">
      {/* Navbar */}
      <nav className="sticky top-0 z-40 border-b border-white/5 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 flex items-center justify-between h-14">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/20 border border-indigo-500/30 flex items-center justify-center">
              <ClipboardList className="w-4 h-4 text-indigo-400" />
            </div>
            <span className="font-semibold text-white text-sm">Complaint Portal</span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-400 hidden sm:block">
              {user.name} · <span className="text-indigo-400">{user.department}</span>
            </span>
            <Link
              href="/complaints/new"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-medium transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Complaint
            </Link>
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
        {/* Welcome */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <h1 className="text-2xl font-bold text-white">
              Welcome back, {user.name.split(' ')[0]}! 👋
            </h1>
            <p className="text-slate-400 text-sm mt-1">
              ID: <span className="text-indigo-400 font-mono">{user.employeeId}</span> ·{' '}
              {user.department}
            </p>
          </div>
          <button
            onClick={fetchData}
            disabled={loading}
            className="flex items-center gap-2 px-3 py-2 rounded-lg border border-white/10 text-slate-400 hover:text-white hover:border-white/20 text-xs transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-2 sm:grid-cols-4 gap-4"
        >
          {[
            { label: 'Total Tickets', value: stats.total, icon: FileText, color: 'indigo' },
            { label: 'Open', value: stats.open, icon: AlertCircle, color: 'amber' },
            { label: 'In Progress', value: stats.inProgress, icon: Clock, color: 'blue' },
            { label: 'Resolved', value: stats.resolved, icon: CheckCircle2, color: 'emerald' },
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

        {/* Complaints Table */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="rounded-2xl bg-white/[0.02] border border-white/5 overflow-hidden"
        >
          {/* Table Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-white/5">
            <h2 className="text-sm font-semibold text-white">My Complaints</h2>
            <Link
              href="/complaints/new"
              className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              New Complaint
            </Link>
          </div>

          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1 px-6 py-3 border-b border-white/5 overflow-x-auto">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                  activeTab === tab
                    ? 'bg-indigo-600 text-white'
                    : 'text-slate-400 hover:text-white hover:bg-white/5'
                }`}
              >
                {tab.replace(/_/g, ' ')}
              </button>
            ))}
          </div>

          {/* Error state */}
          {error && (
            <div className="flex items-center gap-2 px-6 py-4 text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 flex-shrink-0" />
              {error}
            </div>
          )}

          {/* Loading state */}
          {loading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-6 h-6 animate-spin text-indigo-400" />
            </div>
          )}

          {/* Empty state */}
          {!loading && !error && complaints.length === 0 && (
            <div className="flex flex-col items-center justify-center py-16 space-y-3">
              <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-slate-500" />
              </div>
              <p className="text-slate-400 text-sm">No complaints found</p>
              <Link
                href="/complaints/new"
                className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
              >
                Submit your first complaint →
              </Link>
            </div>
          )}

          {/* Complaints list */}
          {!loading && !error && complaints.length > 0 && (
            <div className="divide-y divide-white/5">
              {complaints.map((c, i) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-4 px-6 py-4 hover:bg-white/[0.02] transition-colors group"
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-mono text-xs text-slate-500">{c.ticketNo}</span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          PRIORITY_COLORS[c.priority]
                        }`}
                      >
                        {c.priority}
                      </span>
                      <span
                        className={`text-[10px] px-2 py-0.5 rounded-full border font-medium ${
                          STATUS_COLORS[c.status]
                        }`}
                      >
                        {c.status.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <p className="text-sm text-white font-medium truncate">{c.subject}</p>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {c.category.name} · {formatDate(c.createdAt)}
                    </p>
                  </div>
                  <Link
                    href={`/complaints/${c.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white text-xs transition-colors opacity-0 group-hover:opacity-100"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    View
                  </Link>
                  <ChevronRight className="w-4 h-4 text-slate-600 flex-shrink-0" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Floating Chat Button */}
      <button
        onClick={() => setChatOpen((prev) => !prev)}
        className="fixed bottom-6 right-6 w-12 h-12 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 transition-all hover:-translate-y-0.5 z-40"
        title="AI Support Assistant"
      >
        <Bot className="w-5 h-5 text-white" />
      </button>

      {/* Chat Widget */}
      <AnimatePresence>
        {chatOpen && <ChatWidget onClose={() => setChatOpen(false)} />}
      </AnimatePresence>
    </div>
  );
}
