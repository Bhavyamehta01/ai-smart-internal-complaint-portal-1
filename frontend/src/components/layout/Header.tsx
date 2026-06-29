'use client';

import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import {
  Search,
  Bell,
  Sun,
  Moon,
  Monitor,
  AlignLeft,
  User,
  Settings,
  LogOut,
  ChevronDown,
  Shield,
  CheckCircle2,
  MessageSquare,
  ClipboardList,
} from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface HeaderProps {
  onMobileMenuOpen: () => void;
}

// Mock notifications data
const MOCK_NOTIFICATIONS = [
  {
    id: '1',
    icon: ClipboardList,
    iconColor: 'text-blue-500',
    title: 'Complaint Assigned',
    message: 'COMP-1001001 has been assigned to IT Admin User.',
    time: '2 min ago',
    unread: true,
  },
  {
    id: '2',
    icon: CheckCircle2,
    iconColor: 'text-green-500',
    title: 'Complaint Resolved',
    message: 'COMP-1001004 has been marked as Resolved.',
    time: '1 hr ago',
    unread: true,
  },
  {
    id: '3',
    icon: MessageSquare,
    iconColor: 'text-purple-500',
    title: 'New Comment',
    message: 'IT Admin User added a comment on COMP-1001002.',
    time: '3 hr ago',
    unread: false,
  },
];

const THEME_OPTIONS = [
  { value: 'light', label: 'Light', icon: Sun },
  { value: 'dark', label: 'Dark', icon: Moon },
  { value: 'system', label: 'System', icon: Monitor },
] as const;

export default function Header({ onMobileMenuOpen }: HeaderProps) {
  const { user, logout } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [showTheme, setShowTheme] = useState(false);
  const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);

  const unreadCount = notifications.filter((n) => n.unread).length;

  const ThemeIcon = resolvedTheme === 'dark' ? Moon : Sun;

  const markAllRead = () =>
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));

  const closeAll = () => {
    setShowNotifications(false);
    setShowUserMenu(false);
    setShowTheme(false);
  };

  return (
    <header className="app-header flex items-center gap-3 px-4 sm:px-6">
      {/* Mobile menu toggle */}
      <button
        onClick={onMobileMenuOpen}
        className="btn-icon md:hidden text-muted-foreground hover:text-foreground"
      >
        <AlignLeft className="w-5 h-5" />
      </button>

      {/* Search bar */}
      <div className="relative flex-1 max-w-xs hidden sm:block">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground pointer-events-none" />
        <input
          placeholder="Search complaints..."
          className="w-full pl-9 pr-3 h-8 text-sm rounded-md border border-input bg-muted/30 placeholder:text-muted-foreground text-foreground outline-none focus:ring-2 focus:ring-ring focus:border-transparent transition-colors"
        />
      </div>

      <div className="flex-1" />

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* Theme toggle */}
        <div className="relative">
          <button
            onClick={() => { setShowTheme(!showTheme); setShowNotifications(false); setShowUserMenu(false); }}
            className="btn-icon text-muted-foreground hover:text-foreground"
            title="Switch theme"
          >
            <ThemeIcon className="w-4 h-4" />
          </button>
          {showTheme && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />
              <div className="absolute right-0 top-9 z-50 w-36 bg-popover border border-border rounded-lg shadow-md py-1 overflow-hidden">
                {THEME_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => { setTheme(opt.value); setShowTheme(false); }}
                    className={cn(
                      'flex items-center gap-2.5 w-full px-3 py-2 text-sm hover:bg-accent transition-colors',
                      theme === opt.value ? 'text-primary font-medium' : 'text-foreground'
                    )}
                  >
                    <opt.icon className="w-3.5 h-3.5" />
                    {opt.label}
                    {theme === opt.value && <CheckCircle2 className="w-3 h-3 ml-auto text-primary" />}
                  </button>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Notifications */}
        <div className="relative">
          <button
            onClick={() => { setShowNotifications(!showNotifications); setShowUserMenu(false); setShowTheme(false); }}
            className="btn-icon text-muted-foreground hover:text-foreground relative"
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-red-500 border border-background" />
            )}
          </button>
          {showNotifications && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />
              <div className="absolute right-0 top-9 z-50 w-80 bg-popover border border-border rounded-lg shadow-md overflow-hidden">
                <div className="flex items-center justify-between px-4 py-3 border-b border-border">
                  <span className="text-sm font-semibold text-foreground">Notifications</span>
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-xs text-primary hover:text-primary/80 transition-colors">
                      Mark all read
                    </button>
                  )}
                </div>
                <div className="divide-y divide-border max-h-72 overflow-y-auto">
                  {notifications.map((n) => (
                    <div
                      key={n.id}
                      className={cn(
                        'flex items-start gap-3 px-4 py-3 hover:bg-accent/50 transition-colors cursor-pointer',
                        n.unread && 'bg-primary/5'
                      )}
                      onClick={() => setNotifications(prev => prev.map(x => x.id === n.id ? { ...x, unread: false } : x))}
                    >
                      <n.icon className={cn('w-4 h-4 mt-0.5 flex-shrink-0', n.iconColor)} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <p className="text-xs font-medium text-foreground">{n.title}</p>
                          {n.unread && <span className="w-1.5 h-1.5 rounded-full bg-primary flex-shrink-0" />}
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{n.message}</p>
                        <p className="text-[10px] text-muted-foreground/70 mt-1">{n.time}</p>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2.5 border-t border-border">
                  <button className="text-xs text-primary hover:text-primary/80 transition-colors w-full text-center">
                    View all notifications
                  </button>
                </div>
              </div>
            </>
          )}
        </div>

        {/* User dropdown */}
        <div className="relative">
          <button
            onClick={() => { setShowUserMenu(!showUserMenu); setShowNotifications(false); setShowTheme(false); }}
            className="flex items-center gap-2 px-2 py-1 rounded-md hover:bg-accent transition-colors"
          >
            <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-xs font-semibold text-primary">
                {user?.name?.charAt(0)?.toUpperCase() ?? 'U'}
              </span>
            </div>
            <span className="text-sm text-foreground font-medium hidden sm:block">
              {user?.name?.split(' ')[0]}
            </span>
            <ChevronDown className="w-3.5 h-3.5 text-muted-foreground hidden sm:block" />
          </button>
          {showUserMenu && (
            <>
              <div className="fixed inset-0 z-40" onClick={closeAll} />
              <div className="absolute right-0 top-9 z-50 w-56 bg-popover border border-border rounded-lg shadow-md overflow-hidden">
                <div className="px-4 py-3 border-b border-border">
                  <p className="text-sm font-medium text-foreground">{user?.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{user?.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-0.5 rounded text-[10px] font-medium bg-primary/10 text-primary">
                    {user?.role === 'ADMIN' ? <Shield className="w-2.5 h-2.5" /> : <User className="w-2.5 h-2.5" />}
                    {user?.role}
                  </span>
                </div>
                <div className="py-1">
                  <Link
                    href="/settings"
                    onClick={closeAll}
                    className="flex items-center gap-2.5 px-4 py-2 text-sm text-foreground hover:bg-accent transition-colors"
                  >
                    <Settings className="w-4 h-4 text-muted-foreground" />
                    Settings
                  </Link>
                  <button
                    onClick={() => { closeAll(); logout(); }}
                    className="flex items-center gap-2.5 w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
