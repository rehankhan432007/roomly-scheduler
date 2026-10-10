'use client';

import Link from 'next/link';
import { Bot, Bell, Star, Wrench, BarChart3, QrCode, LogIn } from 'lucide-react';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-lg sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-brand-600 rounded-lg flex items-center justify-center text-white font-bold text-sm">M</div>
            <span className="text-xl font-bold text-slate-900">MeetMaze</span>
            <span className="text-xs bg-brand-100 text-brand-700 px-2 py-0.5 rounded-full font-medium ml-2">Part 4</span>
          </div>
          <nav className="flex items-center gap-4">
            <Link href="/client/roombot" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium transition-colors">
              <Bot size={16} /> RoomBot
            </Link>
            <Link href="/notifications" className="text-sm text-slate-600 hover:text-slate-900 flex items-center gap-1.5 font-medium transition-colors">
              <Bell size={16} /> Notifications
            </Link>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="max-w-7xl mx-auto px-6 py-20">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h1 className="text-5xl font-extrabold text-slate-900 mb-4 tracking-tight">
            Meet Without <span className="text-brand-600">The Maze</span>
          </h1>
          <p className="text-xl text-slate-600 mb-8">
            Part 4 — Experience & Intelligence. QR Check-in, Reviews, RoomBot, Insights, and Notifications.
          </p>
          <div className="flex items-center justify-center gap-4">
            <Link
              href="/client/roombot"
              className="bg-brand-600 hover:bg-brand-700 text-white px-6 py-3 rounded-xl font-semibold transition-colors shadow-md shadow-brand-600/20 flex items-center gap-2"
            >
              <Bot size={18} /> Talk to RoomBot
            </Link>
            <Link
              href="/checkin/demo"
              className="bg-white hover:bg-slate-50 text-slate-800 px-6 py-3 rounded-xl font-semibold transition-colors border border-slate-200 flex items-center gap-2"
            >
              <QrCode size={18} /> Try Check-in
            </Link>
          </div>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <FeatureCard
            icon={<QrCode className="text-brand-600" size={28} />}
            title="QR Check-in"
            description="Scan the QR at the room to check in. Auto-release if nobody shows up in time."
            href="/checkin/demo"
          />
          <FeatureCard
            icon={<Star className="text-amber-500" size={28} />}
            title="Reviews & Issues"
            description="Rate rooms 1–10, tag good and bad, report broken equipment. Bayesian ranking keeps it fair."
            href="/owner/reviews"
          />
          <FeatureCard
            icon={<Bot className="text-indigo-600" size={28} />}
            title="RoomBot"
            description="Chat to book: 'Book a room for 8 tomorrow at 3 PM with a projector.' Slot filling, match scoring, confirm."
            href="/client/roombot"
          />
          <FeatureCard
            icon={<BarChart3 className="text-emerald-600" size={28} />}
            title="Demand Insights"
            description="Heatmap of demand by day × hour. AI suggests peak windows and quiet promotions."
            href="/owner/insights"
          />
          <FeatureCard
            icon={<Bell className="text-blue-600" size={28} />}
            title="Notifications"
            description="Booking reminders, review requests, issue updates. Real-time polling."
            href="/notifications"
          />
          <FeatureCard
            icon={<Wrench className="text-slate-600" size={28} />}
            title="Issue Management"
            description="Owners see all reported issues. Acknowledge, resolve, auto-clear equipment flags."
            href="/owner/issues"
          />
        </div>

        {/* Architecture Info */}
        <div className="mt-16 bg-white border border-slate-200 rounded-2xl p-8 shadow-sm">
          <h2 className="text-2xl font-bold text-slate-900 mb-6">Architecture</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-sm">
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Backend Modules</h3>
              <ul className="space-y-2 text-slate-600">
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span> notifications — Service + Jobs</li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span> ranking — Bayesian + Stats</li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span> reviews — CRUD + Issues</li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span> checkin — QR + Auto-release</li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span> insights — Demand Heatmap</li>
                <li className="flex gap-2"><span className="w-1.5 h-1.5 rounded-full bg-green-400 mt-1.5 shrink-0"></span> roombot — NLP + Dialog FSM</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Background Jobs</h3>
              <ul className="space-y-2 text-slate-600">
                <li>auto-release (30s) — release un-checked-in bookings</li>
                <li>booking-reminders (1m) — remind 15 min before</li>
                <li>review-requests (5m) — prompt after checkout</li>
                <li>recompute-all-stats (24h) — Bayesian stats</li>
                <li>recompute-demand (1h) — demand heatmap</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-slate-800 mb-3">Dev Stubs</h3>
              <ul className="space-y-2 text-slate-600">
                <li>auth.stub — Login / Register / Me</li>
                <li>rooms.stub — 6 seed rooms + QR tokens</li>
                <li>bookings.stub — In-memory CRUD</li>
                <li>search.stub — Scoring + availability</li>
              </ul>
              <div className="mt-4 p-3 bg-blue-50 rounded-lg text-blue-800 text-xs">
                Part 4 runs independently using dev stubs. After merge with Parts 1-3, stubs are replaced by real services.
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}

function FeatureCard({ icon, title, description, href }: { icon: React.ReactNode; title: string; description: string; href: string }) {
  return (
    <Link href={href}>
      <div className="bg-white border border-slate-200 rounded-xl p-6 shadow-sm hover:shadow-md hover:border-slate-300 transition-all group cursor-pointer h-full">
        <div className="mb-4">{icon}</div>
        <h3 className="text-lg font-semibold text-slate-900 mb-2 group-hover:text-brand-600 transition-colors">{title}</h3>
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
      </div>
    </Link>
  );
}
