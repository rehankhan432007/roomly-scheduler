'use client';
import React, { useState } from 'react';
import { PageHeader, Button, Input, Select, StatusBadge, Spinner, ErrorState } from '@/design-system';
import { useRooms, useLocations, useUpdateRoom } from '../hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function RoomsPage() {
  const [q, setQ] = useState('');
  const [status, setStatus] = useState('');
  const [locationId, setLocationId] = useState('');
  const router = useRouter();

  const { data: locData } = useLocations();
  const { data, isLoading, error, refetch } = useRooms({ q, status, locationId });
  const updateRoom = useUpdateRoom();

  const handleToggleActive = async (room: any) => {
    const newStatus = room.status === 'ACTIVE' ? 'INACTIVE' : 'ACTIVE';
    try {
      await updateRoom.mutateAsync({ id: room.id, data: { status: newStatus } });
      toast.success(`Room marked as ${newStatus}`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to update status');
    }
  };

  const locOptions = locData?.map((l: any) => ({ value: l.id, label: l.name })) || [];

  return (
    <div className="max-w-6xl mx-auto py-8">
      <PageHeader
        title="My Rooms"
        description="Manage your meeting spaces and their availability."
        actions={<Button onClick={() => router.push('/owner/rooms/new')}>Add Room</Button>}
      />

      <div className="flex flex-col sm:flex-row gap-4 mb-6">
        <div className="flex-1">
          <Input placeholder="Search rooms..." value={q} onChange={e => setQ(e.target.value)} />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={status}
            onChange={e => setStatus(e.target.value)}
            options={[
              { value: '', label: 'All Statuses' },
              { value: 'ACTIVE', label: 'Active' },
              { value: 'INACTIVE', label: 'Inactive' },
              { value: 'MAINTENANCE', label: 'Maintenance' },
            ]}
          />
        </div>
        <div className="w-full sm:w-48">
          <Select
            value={locationId}
            onChange={e => setLocationId(e.target.value)}
            options={[{ value: '', label: 'All Locations' }, ...locOptions]}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="p-8 flex justify-center"><Spinner size="lg" /></div>
      ) : error ? (
        <ErrorState message="Failed to load rooms" onRetry={refetch} />
      ) : data?.data?.length === 0 ? (
        <div className="text-center p-12 bg-surface rounded-card border border-line">
          <p className="text-muted text-body">No rooms found matching your filters.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {data.data.map((r: any) => (
            <div key={r.id} className="bg-surface border border-line/60 rounded-card overflow-hidden hover:shadow-card transition-shadow flex flex-col">
              <div className="h-48 bg-canvas relative group cursor-pointer" onClick={() => router.push(`/owner/rooms/${r.id}`)}>
                {r.photos?.[0] ? (
                  <img src={r.photos[0]} alt={r.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted">No image</div>
                )}
                <div className="absolute top-3 left-3 flex gap-2">
                  <StatusBadge kind="room" status={r.status} />
                </div>
              </div>
              
              <div className="p-4 flex-1 flex flex-col">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-h3 font-semibold text-ink cursor-pointer hover:text-primary transition-colors" onClick={() => router.push(`/owner/rooms/${r.id}`)}>
                    {r.name}
                  </h3>
                  <div className="text-right">
                    <span className="font-semibold text-ink">₹{r.hourlyPrice}</span><span className="text-small text-muted">/hr</span>
                  </div>
                </div>
                
                <p className="text-small text-muted mb-4">{r.locationName} {r.floor ? `· ${r.floor}` : ''} · Up to {r.capacity} people</p>
                
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {r.equipment?.slice(0, 4).map((eq: any) => (
                    <span key={eq.code} className="inline-flex items-center justify-center w-6 h-6 rounded-md bg-canvas text-muted text-xs border border-line" title={eq.name}>
                      {/* For real app use Lucide icons dynamically */}
                      {eq.name.charAt(0)}
                    </span>
                  ))}
                  {r.equipment?.length > 4 && (
                    <span className="inline-flex items-center justify-center h-6 px-2 rounded-md bg-canvas text-muted text-xs font-medium border border-line">
                      +{r.equipment.length - 4}
                    </span>
                  )}
                </div>

                <div className="mt-auto pt-4 border-t border-line/60 flex items-center justify-between">
                  <Button variant="ghost" size="sm" onClick={() => handleToggleActive(r)}>
                    {r.status === 'ACTIVE' ? 'Deactivate' : 'Activate'}
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => router.push(`/owner/rooms/${r.id}/edit`)}>
                    Edit
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
