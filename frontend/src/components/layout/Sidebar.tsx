'use client';

import React, { useState, useCallback } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import {
  LayoutDashboard,
  ClipboardList,
  Plus,
  Bot,
  BarChart3,
  Settings,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Shield,
  Users,
  FileText,
  AlignLeft,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  roles?: Array<'ADMIN' | 'EMPLOYEE'>;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['EMPLOYEE'] },
  { href: '/admin/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADMIN'] },
  { href: '/complaints/new', label: 'New Complaint', icon: Plus, roles: ['EMPLOYEE'] },
  { href: '/admin/users', label: 'Users', icon: Users, roles: ['ADMIN'] },
  { href: '/settings', label: 'Settings', icon: Settings },
];

interface SidebarProps {
  collapsed: boolean;
  onCollapse: (v: boolean) => void;
  mobileOpen: boolean;
  onMobileClose: () => void;
}

export default function Sidebar({ collapsed, onCollapse, mobileOpen, onMobileClose }: SidebarProps) {
  const pathname = usePathname();
  const { user, logout } = useAuth();

  const filteredItems = NAV_ITEMS.filter((item) => {
    if (!item.roles) return true;
    if (!user) return false;
    return item.roles.includes(user.role);
  });

  const isActive = (href: string) => pathname === href || pathname.startsWith(href + '/');

  return (
    <>
      {/* Mobile backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={onMobileClose}
        />
      )}

      <aside
        className={cn(
          'sidebar-container flex flex-col',
          collapsed && 'collapsed',
          mobileOpen && 'mobile-open'
        )}
      >
        {/* Logo / Brand */}
        <div className={cn(
          'flex items-center h-14 border-b border-[hsl(var(--sidebar-border))] flex-shrink-0',
          collapsed ? 'justify-center px-0' : 'px-4 gap-3'
        )}>
          {!collapsed && (
            <>
              <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center flex-shrink-0">
                <Shield className="w-4 h-4 text-primary-foreground" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">Complaint Portal</p>
                <p className="text-[10px] text-muted-foreground truncate">Enterprise</p>
              </div>
            </>
          )}
          {collapsed && (
            <div className="w-8 h-8 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
          )}
          {/* Mobile close */}
          {mobileOpen && !collapsed && (
            <button onClick={onMobileClose} className="ml-auto btn-icon md:hidden">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Navigation */}
        <nav className={cn('flex-1 overflow-y-auto py-3', collapsed ? 'px-2' : 'px-3')}>
          <div className="space-y-0.5">
            {filteredItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                onClick={onMobileClose}
                title={collapsed ? item.label : undefined}
                className={cn(
                  'sidebar-item',
                  isActive(item.href) && 'active'
                )}
              >
                <item.icon className="w-4 h-4 flex-shrink-0" />
                <span className="sidebar-label text-sm">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>

        {/* User + Logout at bottom */}
        <div className={cn(
          'border-t border-[hsl(var(--sidebar-border))] py-3 flex-shrink-0',
          collapsed ? 'px-2' : 'px-3'
        )}>
          {user && !collapsed && (
            <div className="px-3 py-2 mb-2">
              <div className="flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {user.name.charAt(0).toUpperCase()}
                  </span>
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-[10px] text-muted-foreground truncate">{user.role}</p>
                </div>
              </div>
            </div>
          )}
          <button
            onClick={logout}
            title={collapsed ? 'Logout' : undefined}
            className={cn('sidebar-item w-full text-left', collapsed && 'justify-center')}
          >
            <LogOut className="w-4 h-4 flex-shrink-0 text-muted-foreground" />
            <span className="sidebar-label text-muted-foreground">Logout</span>
          </button>
        </div>

        {/* Collapse toggle (desktop only) */}
        <button
          onClick={() => onCollapse(!collapsed)}
          className={cn(
            'hidden md:flex items-center justify-center h-6 w-6 rounded-full',
            'border border-border bg-background text-muted-foreground hover:text-foreground',
            'absolute -right-3 top-[68px] z-50 transition-colors shadow-sm'
          )}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {collapsed ? <ChevronRight className="w-3 h-3" /> : <ChevronLeft className="w-3 h-3" />}
        </button>
      </aside>
    </>
  );
}
