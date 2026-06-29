'use client';

import Link from 'next/link';
import { Shield, ArrowRight, CheckCircle2, BarChart3, Bot, Lock } from 'lucide-react';

const FEATURES = [
  { icon: BarChart3, title: 'Real-time Analytics', desc: 'Track complaint trends, resolution rates, and team performance.' },
  { icon: Bot, title: 'AI-Powered Classification', desc: 'Automatic category and priority prediction using intelligent pattern matching.' },
  { icon: Lock, title: 'Role-Based Access', desc: 'Secure access for employees and administrators with JWT authentication.' },
  { icon: CheckCircle2, title: 'Full Audit Trail', desc: 'Complete timeline, comments, and activity logs for every complaint.' },
];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border bg-background/80 backdrop-blur-sm sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center">
              <Shield className="w-4 h-4 text-primary-foreground" />
            </div>
            <span className="text-sm font-semibold text-foreground">Complaint Portal</span>
          </div>
          <Link
            href="/login"
            className="btn btn-primary btn-sm"
          >
            Sign In
          </Link>
        </div>
      </header>

      {/* Hero */}
      <section className="flex-1 flex flex-col items-center justify-center text-center px-6 py-24">
        <div className="max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border text-xs text-muted-foreground bg-muted/30 mb-8">
            <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
            Enterprise Complaint Management System
          </div>

          <h1 className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight leading-tight mb-6">
            Smart Internal<br />
            <span className="text-primary">Complaint Portal</span>
          </h1>

          <p className="text-lg text-muted-foreground mb-10 max-w-lg mx-auto leading-relaxed">
            Streamline IT issue tracking with AI-powered classification, real-time status updates, and comprehensive analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-3 justify-center">
            <Link href="/login" className="btn btn-primary gap-2">
              Access Portal
              <ArrowRight className="w-4 h-4" />
            </Link>
            <div className="text-xs text-muted-foreground">
              Use <code className="font-mono bg-muted px-1.5 py-0.5 rounded">employee@portal.com</code> to sign in
            </div>
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="max-w-5xl mx-auto px-6 pb-20 w-full">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {FEATURES.map((f) => (
            <div key={f.title} className="stat-card space-y-3">
              <div className="w-8 h-8 rounded-md bg-primary/10 flex items-center justify-center">
                <f.icon className="w-4 h-4 text-primary" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-foreground">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6">
        <div className="max-w-6xl mx-auto px-6 text-center text-xs text-muted-foreground">
          Smart Internal Complaint Management Portal — Enterprise Edition
        </div>
      </footer>
    </div>
  );
}
