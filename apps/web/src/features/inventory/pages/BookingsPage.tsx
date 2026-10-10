'use client';
import React from 'react';
import { PageHeader, DataTable, StatusBadge, Spinner, ErrorState } from '@/design-system';
import { useOwnerBookings } from '../hooks';
import { format } from 'date-fns';

export default function BookingsPage() {
  const { data, isLoading, error } = useOwnerBookings({});

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message="Failed to load bookings" />;

  return (
    <div className="max-w-6xl mx-auto py-8">
      <PageHeader
        title="All Bookings"
        description="View all upcoming and past bookings across your properties."
      />

      <DataTable
        columns={[
          { key: 'startAt', header: 'Date & Time', render: (b: any) => (
            <div>
              <div className="font-medium">{format(new Date(b.startAt), 'MMM d, yyyy')}</div>
              <div className="text-small text-muted">{format(new Date(b.startAt), 'h:mm a')} - {format(new Date(b.endAt), 'h:mm a')}</div>
            </div>
          )},
          { key: 'roomName', header: 'Room' },
          { key: 'title', header: 'Meeting Title' },
          { key: 'client', header: 'Client', render: (b: any) => (
            <div>
              <div className="font-medium">{b.clientName}</div>
              <div className="text-small text-muted">{b.clientCompany || 'Independent'}</div>
            </div>
          )},
          { key: 'attendeeCount', header: 'Attendees', align: 'center' },
          { key: 'totalPrice', header: 'Price', render: (b: any) => `₹${b.totalPrice}` },
          { key: 'status', header: 'Status', render: (b: any) => <StatusBadge kind="booking" status={b.status} /> },
        ]}
        rows={data?.data || []}
        rowKey={(b: any) => b.id}
        empty={<p className="p-6 text-center text-muted">No bookings found.</p>}
        pagination={{
          page: data?.meta?.page || 1,
          pageSize: data?.meta?.pageSize || 20,
          total: data?.meta?.total || 0,
          onPageChange: () => {} // In a real app we'd update state and refetch
        }}
      />
    </div>
  );
}
