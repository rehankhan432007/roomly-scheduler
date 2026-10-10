'use client';
import React, { useState } from 'react';
import { PageHeader, StatCard, Card, Tabs, Spinner, ErrorState, Button, DataTable, StatusBadge } from '@/design-system';
import { useDashboard } from '../hooks';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useRouter } from 'next/navigation';
import { Slot } from '@/core/Slot';

export default function DashboardPage() {
  const [range, setRange] = useState('7d');
  const { data, isLoading, error, refetch } = useDashboard(range);
  const router = useRouter();

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message="Failed to load dashboard" onRetry={refetch} />;
  
  const { totals, utilizationByDay, underusedRooms, todaySchedule } = data;

  if (totals.rooms === 0) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <PageHeader title="Welcome to MeetMaze" />
        <Card className="text-center py-12">
          <div className="mb-4">
            <svg className="w-16 h-16 mx-auto text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <h2 className="text-h2 font-semibold text-ink mb-2">List your first room</h2>
          <p className="text-body text-muted mb-6 max-w-md mx-auto">Start monetizing your unused meeting spaces effortlessly. Add a room to get started.</p>
          <Button size="lg" onClick={() => router.push('/owner/rooms/new')}>Add Room</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-8">
      <div className="flex justify-between items-end mb-8 border-b border-line/60">
        <PageHeader title="Dashboard" description="Overview of your spaces and bookings." />
        <Tabs
          tabs={[{ id: '7d', label: 'Last 7 Days' }, { id: '30d', label: 'Last 30 Days' }]}
          value={range}
          onChange={setRange}
        />
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
        <StatCard label="Total Rooms" value={totals.activeRooms} tone="neutral" />
        <StatCard label="Bookings Today" value={totals.bookingsToday} tone="primary" />
        <StatCard label="Utilization" value={`${totals.utilizationPct}%`} tone="success" />
        <StatCard label="Revenue" value={`₹${totals.revenueInRange}`} tone="neutral" />
        <StatCard label="Open Issues" value={totals.openIssues} tone={totals.openIssues > 0 ? 'danger' : 'neutral'} />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card title="Utilization by day" className="lg:col-span-2 min-h-[350px]">
          <div className="h-72 w-full mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={utilizationByDay} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <XAxis dataKey="date" tickFormatter={d => new Date(d).toLocaleDateString(undefined, { weekday: 'short' })} axisLine={false} tickLine={false} />
                <YAxis axisLine={false} tickLine={false} domain={[0, 100]} tickFormatter={v => `${v}%`} />
                <Tooltip cursor={{ fill: '#F6F8FC' }} formatter={(val) => [`${val}%`, 'Utilization']} labelFormatter={d => new Date(d).toLocaleDateString()} />
                <Bar dataKey="pct" fill="#1F6FEB" radius={[4, 4, 0, 0]} barSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        <Card title="Today's schedule">
          {todaySchedule.length === 0 ? (
            <p className="text-muted text-small text-center py-8">No bookings today.</p>
          ) : (
            <div className="space-y-4 max-h-72 overflow-y-auto pr-2 mt-4">
              {todaySchedule.map((b: any) => (
                <div key={b.bookingId} className="flex justify-between items-start border-b border-line/60 pb-3 last:border-0 last:pb-0">
                  <div>
                    <p className="font-medium text-body text-ink">{b.roomName}</p>
                    <p className="text-small text-muted">{new Date(b.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} - {new Date(b.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                  <StatusBadge kind="booking" status={b.status} />
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {underusedRooms.length > 0 && (
        <Card title="Underused rooms — earn more" className="mb-8 border-warning-50 bg-warning-50/20">
          <div className="space-y-3 mt-4">
            {underusedRooms.map((r: any) => (
              <div key={r.roomId} className="flex justify-between items-center bg-surface p-3 rounded-control border border-line">
                <div>
                  <p className="font-medium">{r.name} <span className="text-warning text-small ml-2">({r.utilizationPct}% utilization)</span></p>
                  <p className="text-small text-muted">{r.suggestion}</p>
                </div>
                <Button variant="secondary" size="sm" onClick={() => router.push(`/owner/rooms/${r.roomId}/edit`)}>Edit pricing</Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Slot name="owner.dashboard.widgets" context={{}} />
    </div>
  );
}
