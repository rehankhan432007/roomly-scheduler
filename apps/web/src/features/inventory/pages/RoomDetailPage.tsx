'use client';
import React, { useState } from 'react';
import { PageHeader, Card, Button, Tabs, StatusBadge, Spinner, ErrorState, EquipmentChip, ConfirmDialog, Modal, FormField, Input, DataTable } from '@/design-system';
import { useRoom, useQr, useRotateQr, useBlackouts, useCreateBlackout, useDeleteBlackout, usePatchEquipment } from '../hooks';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';
import { toast } from 'sonner';

export default function RoomDetailPage({ roomId }: { roomId: string }) {
  const router = useRouter();
  const [tab, setTab] = useState('overview');
  
  const { data: roomRes, isLoading, error, refetch } = useRoom(roomId);
  const room = roomRes?.data;

  // Overview Tab: Equipment fixing
  const patchEq = usePatchEquipment();
  const handleFixEquipment = async (code: string) => {
    try {
      await patchEq.mutateAsync({ roomId, code, data: { status: 'WORKING' } });
      toast.success('Equipment marked as working');
    } catch (e: any) {
      toast.error(e.message || 'Failed to update equipment');
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error || !room) return <ErrorState message="Failed to load room" onRetry={refetch} />;

  const faultyEq = room.equipment?.filter((e: any) => e.status === 'FAULTY') || [];

  return (
    <div className="max-w-5xl mx-auto py-8">
      <PageHeader
        title={room.name}
        breadcrumbs={<span className="cursor-pointer hover:underline" onClick={() => router.push('/owner/rooms')}>My Rooms</span>}
        actions={
          <>
            <StatusBadge kind="room" status={room.status} />
            <Button variant="secondary" onClick={() => router.push(`/owner/rooms/${roomId}/edit`)}>Edit</Button>
          </>
        }
      />

      <Tabs
        tabs={[
          { id: 'overview', label: 'Overview', badge: faultyEq.length > 0 ? <span className="ml-2 bg-danger text-white px-1.5 py-0.5 rounded-full text-[10px]">{faultyEq.length}</span> : null },
          { id: 'schedule', label: 'Schedule' },
          { id: 'blackouts', label: 'Blackouts' },
          { id: 'qr', label: 'QR Check-in' },
        ]}
        value={tab}
        onChange={setTab}
      />

      <div className="mt-8">
        {tab === 'overview' && (
          <div className="space-y-6">
            {faultyEq.length > 0 && (
              <div className="bg-danger-50 border border-danger/20 p-4 rounded-card">
                <h3 className="text-danger font-medium mb-2">Attention Required</h3>
                <div className="space-y-2">
                  {faultyEq.map((eq: any) => (
                    <div key={eq.code} className="flex justify-between items-center bg-white p-3 rounded-control">
                      <div>
                        <p className="font-medium">{eq.name} flagged as faulty</p>
                        <p className="text-small text-muted">A guest reported an issue. Once resolved, mark it as fixed.</p>
                      </div>
                      <Button size="sm" onClick={() => handleFixEquipment(eq.code)}>Mark as fixed</Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <Card title="Details" className="md:col-span-2">
                <dl className="grid grid-cols-2 gap-y-4">
                  <div><dt className="text-small text-muted">Location</dt><dd className="font-medium">{room.locationName}</dd></div>
                  <div><dt className="text-small text-muted">Capacity</dt><dd className="font-medium">{room.capacity} people</dd></div>
                  <div><dt className="text-small text-muted">Price</dt><dd className="font-medium">₹{room.hourlyPrice}/hr</dd></div>
                  <div><dt className="text-small text-muted">Type / Vibe</dt><dd className="font-medium">{room.roomType} / {room.vibe}</dd></div>
                  <div><dt className="text-small text-muted">Hours</dt><dd className="font-medium">{room.openTime} - {room.closeTime}</dd></div>
                  <div><dt className="text-small text-muted">Auto-release</dt><dd className="font-medium">After {room.checkinGraceMinutes} min</dd></div>
                </dl>
              </Card>

              <Card title="Equipment">
                <div className="flex flex-wrap gap-2 mt-4">
                  {room.equipment?.length === 0 && <span className="text-muted">No equipment listed</span>}
                  {room.equipment?.map((eq: any) => (
                    <EquipmentChip key={eq.code} code={eq.code} name={eq.name} icon={null} quantity={eq.quantity} status={eq.status} />
                  ))}
                </div>
              </Card>
            </div>
          </div>
        )}

        {tab === 'schedule' && (
          <Card title="Upcoming Bookings">
            <p className="text-muted p-4 text-center">Calendar and schedule view goes here (Provided by Part 3 & 4 data)</p>
          </Card>
        )}

        {tab === 'blackouts' && <BlackoutsTab roomId={roomId} />}
        {tab === 'qr' && <QrTab roomId={roomId} />}
      </div>
    </div>
  );
}

function BlackoutsTab({ roomId }: { roomId: string }) {
  const { data: res, isLoading } = useBlackouts(roomId);
  const [modalOpen, setModalOpen] = useState(false);
  const [startAt, setStartAt] = useState('');
  const [endAt, setEndAt] = useState('');
  const [reason, setReason] = useState('');
  const createBlackout = useCreateBlackout();
  const deleteBlackout = useDeleteBlackout();

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createBlackout.mutateAsync({ roomId, data: { startAt: new Date(startAt).toISOString(), endAt: new Date(endAt).toISOString(), reason } });
      toast.success('Blackout created');
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to create blackout');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Remove this blackout?')) {
      await deleteBlackout.mutateAsync({ roomId, blackoutId: id });
    }
  };

  if (isLoading) return <Spinner />;
  const blackouts = res?.data || [];

  return (
    <div>
      <div className="flex justify-end mb-4">
        <Button onClick={() => setModalOpen(true)}>Add Blackout</Button>
      </div>
      <DataTable
        columns={[
          { key: 'startAt', header: 'Start', render: (b: any) => format(new Date(b.startAt), 'MMM d, h:mm a') },
          { key: 'endAt', header: 'End', render: (b: any) => format(new Date(b.endAt), 'MMM d, h:mm a') },
          { key: 'reason', header: 'Reason' },
          { key: 'actions', header: '', align: 'right', render: (b: any) => (
            <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(b.id)}>Delete</Button>
          )}
        ]}
        rows={blackouts}
        rowKey={(b: any) => b.id}
        empty={<p className="p-6 text-center text-muted">No blackouts scheduled.</p>}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title="Add Blackout">
        <form onSubmit={handleCreate} className="space-y-4">
          <FormField label="Start" required><Input type="datetime-local" value={startAt} onChange={e => setStartAt(e.target.value)} required /></FormField>
          <FormField label="End" required><Input type="datetime-local" value={endAt} onChange={e => setEndAt(e.target.value)} required /></FormField>
          <FormField label="Reason"><Input value={reason} onChange={e => setReason(e.target.value)} /></FormField>
          <div className="pt-4 flex justify-end gap-3"><Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button><Button type="submit" loading={createBlackout.isPending}>Save</Button></div>
        </form>
      </Modal>
    </div>
  );
}

function QrTab({ roomId }: { roomId: string }) {
  const { data: res, isLoading } = useQr(roomId);
  const rotateQr = useRotateQr();
  const [confirmRotate, setConfirmRotate] = useState(false);

  if (isLoading) return <Spinner />;
  if (!res?.data) return <ErrorState message="Could not load QR code" />;
  const { checkinUrl, svg } = res.data;

  const handleRotate = async () => {
    try {
      await rotateQr.mutateAsync(roomId);
      toast.success('QR Code rotated. The old one is now invalid.');
      setConfirmRotate(false);
    } catch (e: any) {
      toast.error('Failed to rotate QR');
    }
  };

  return (
    <Card className="flex flex-col md:flex-row gap-8 items-center md:items-start p-8">
      <div className="w-64 h-64 bg-white border border-line p-4 rounded-card shadow-sm" dangerouslySetInnerHTML={{ __html: svg }} />
      <div className="flex-1 space-y-6">
        <div>
          <h3 className="text-h3 font-semibold mb-2">Room Check-in QR</h3>
          <p className="text-body text-muted mb-4">Print this and place it outside the room. Users must scan it to confirm they have arrived, otherwise the room is automatically released.</p>
          <div className="flex gap-3">
            <Button onClick={() => window.open(`/owner/rooms/${roomId}/qr-print`, '_blank')}>Print Poster</Button>
            <Button variant="secondary" onClick={() => { navigator.clipboard.writeText(checkinUrl); toast.success('URL copied'); }}>Copy Link</Button>
          </div>
        </div>
        <div className="pt-6 border-t border-line/60">
          <h4 className="font-medium text-danger mb-2">Security</h4>
          <p className="text-small text-muted mb-4">If someone printed a copy of this QR and is checking in from home, rotate it to invalidate the old code.</p>
          <Button variant="danger" size="sm" onClick={() => setConfirmRotate(true)}>Rotate QR Code</Button>
        </div>
      </div>
      <ConfirmDialog open={confirmRotate} onCancel={() => setConfirmRotate(false)} onConfirm={handleRotate} tone="danger" title="Rotate QR Code?" message="The current QR code will immediately stop working. You must print and place the new one." loading={rotateQr.isPending} confirmLabel="Rotate" />
    </Card>
  );
}
