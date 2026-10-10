'use client';
import React, { useEffect } from 'react';
import { PageHeader, Card, Button, FormField, Input, Select, NumberStepper, Switch, ChipToggle, Spinner, ErrorState } from '@/design-system';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createRoomSchema, updateRoomSchema } from '@meetmaze/shared/modules/rooms';
import { useLocations, useEquipmentTypes, useRoom, useCreateRoom, useUpdateRoom } from '../hooks';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

export default function RoomFormPage({ roomId }: { roomId?: string }) {
  const router = useRouter();
  const isEditing = !!roomId;

  const { data: locData } = useLocations();
  const { data: eqTypes } = useEquipmentTypes();
  const { data: roomData, isLoading, error } = useRoom(roomId || '');

  const createRoom = useCreateRoom();
  const updateRoom = useUpdateRoom();

  const { register, control, handleSubmit, reset, watch, setValue, formState: { errors, isDirty } } = useForm({
    resolver: zodResolver(isEditing ? updateRoomSchema : createRoomSchema),
    defaultValues: {
      name: '', description: '', locationId: '', floor: '', capacity: 4, roomType: 'MEETING', vibe: 'FORMAL', hourlyPrice: 0,
      photos: [], openTime: '09:00', closeTime: '19:00', openDays: [1, 2, 3, 4, 5],
      minBookingMinutes: 30, maxBookingMinutes: 480, bufferMinutes: 0, checkinGraceMinutes: 15,
      status: 'ACTIVE', equipment: []
    }
  });

  const { fields: eqFields, append: appendEq, remove: removeEq } = useFieldArray({ control, name: 'equipment' });

  useEffect(() => {
    if (isEditing && roomData?.data) {
      const d = roomData.data;
      reset({
        name: d.name, description: d.description || '', locationId: d.locationId, floor: d.floor || '', capacity: d.capacity,
        roomType: d.roomType, vibe: d.vibe, hourlyPrice: d.hourlyPrice, photos: d.photos || [],
        openTime: d.openTime.slice(0, 5), closeTime: d.closeTime.slice(0, 5), openDays: d.openDays,
        minBookingMinutes: d.minBookingMinutes, maxBookingMinutes: d.maxBookingMinutes, bufferMinutes: d.bufferMinutes, checkinGraceMinutes: d.checkinGraceMinutes,
        status: d.status, equipment: d.equipment || []
      });
    }
  }, [isEditing, roomData, reset]);

  // Warn on unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isDirty]);

  const onSubmit = async (data: any) => {
    try {
      if (isEditing) {
        await updateRoom.mutateAsync({ id: roomId, data });
        toast.success('Room updated');
        router.push(`/owner/rooms/${roomId}`);
      } else {
        const res = await createRoom.mutateAsync(data);
        toast.success('Room created');
        router.push(`/owner/rooms/${res.data.id}`);
      }
    } catch (e: any) {
      toast.error(e.message || 'Failed to save room');
    }
  };

  const handleCancel = () => {
    if (isDirty && !window.confirm('You have unsaved changes. Are you sure you want to leave?')) return;
    router.back();
  };

  const openDays = watch('openDays') as number[];
  const toggleDay = (day: number) => {
    const newDays = openDays.includes(day) ? openDays.filter(d => d !== day) : [...openDays, day];
    setValue('openDays', newDays, { shouldDirty: true });
  };

  if (isEditing && isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (isEditing && error) return <ErrorState message="Failed to load room" />;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-4xl mx-auto py-8 pb-32">
      <PageHeader title={isEditing ? 'Edit Room' : 'Add Room'} />

      <div className="space-y-8">
        <Card title="Basics">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Name" error={errors.name?.message as string} required>
              <Input {...register('name')} placeholder="e.g. Atlas Room" />
            </FormField>
            <FormField label="Location" error={errors.locationId?.message as string} required>
              <Select {...register('locationId')} disabled={isEditing} options={locData?.map((l: any) => ({ value: l.id, label: l.name })) || []} />
            </FormField>
            <FormField label="Floor (optional)" error={errors.floor?.message as string}>
              <Input {...register('floor')} placeholder="e.g. 2nd Floor" />
            </FormField>
            <div className="col-span-1 md:col-span-2">
              <FormField label="Description" error={errors.description?.message as string}>
                <textarea {...register('description')} className="flex min-h-[80px] w-full rounded-control border border-line bg-surface px-3 py-2 text-body focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary" />
              </FormField>
            </div>
          </div>
        </Card>

        <Card title="Capacity & Style">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <FormField label="Capacity (people)" error={errors.capacity?.message as string} required>
              <NumberStepper value={watch('capacity')} onChange={v => setValue('capacity', v, { shouldDirty: true })} min={1} max={500} />
            </FormField>
            <FormField label="Room Type" error={errors.roomType?.message as string} required>
              <Select {...register('roomType')} options={[
                { value: 'MEETING', label: 'Meeting Room' },
                { value: 'BOARDROOM', label: 'Boardroom' },
                { value: 'HUDDLE', label: 'Huddle Space' },
                { value: 'TRAINING', label: 'Training Room' },
                { value: 'PHONE_BOOTH', label: 'Phone Booth' },
                { value: 'COWORKING', label: 'Coworking Desk' },
              ]} />
            </FormField>
            <FormField label="Vibe" error={errors.vibe?.message as string} required>
              <Select {...register('vibe')} options={[
                { value: 'FORMAL', label: 'Formal' },
                { value: 'CASUAL', label: 'Casual' },
                { value: 'CREATIVE', label: 'Creative' },
                { value: 'QUIET', label: 'Quiet' },
                { value: 'PRESENTATION', label: 'Presentation' },
              ]} />
            </FormField>
          </div>
        </Card>

        <Card title="Pricing & Rules">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FormField label="Hourly Price (₹)" error={errors.hourlyPrice?.message as string} required>
              <Input type="number" {...register('hourlyPrice', { valueAsNumber: true })} min="0" />
            </FormField>
            <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField label="Min Duration (min)" error={errors.minBookingMinutes?.message as string} hint="Multiple of 15">
                <Input type="number" {...register('minBookingMinutes', { valueAsNumber: true })} step="15" min="15" />
              </FormField>
              <FormField label="Max Duration (min)" error={errors.maxBookingMinutes?.message as string} hint="Multiple of 15">
                <Input type="number" {...register('maxBookingMinutes', { valueAsNumber: true })} step="15" min="15" />
              </FormField>
              <FormField label="Buffer Time (min)" error={errors.bufferMinutes?.message as string} hint="Gap between meetings">
                <Input type="number" {...register('bufferMinutes', { valueAsNumber: true })} min="0" max="60" />
              </FormField>
            </div>
            <div className="col-span-1 md:col-span-2 pt-4 border-t border-line/60">
              <FormField label="Check-in Grace Period" hint="Room is released automatically if nobody scans the QR within this many minutes of start">
                <NumberStepper value={watch('checkinGraceMinutes')} onChange={v => setValue('checkinGraceMinutes', v, { shouldDirty: true })} min={10} max={15} unit="minutes" />
              </FormField>
            </div>
          </div>
        </Card>

        <Card title="Operating Hours">
          <div className="space-y-6">
            <div className="flex gap-4">
              <FormField label="Open Time" required>
                <Input type="time" {...register('openTime')} />
              </FormField>
              <FormField label="Close Time" required>
                <Input type="time" {...register('closeTime')} />
              </FormField>
            </div>
            <FormField label="Open Days" required>
              <div className="flex flex-wrap gap-2">
                {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, idx) => (
                  <ChipToggle key={day} selected={openDays.includes(idx + 1)} onToggle={() => toggleDay(idx + 1)}>
                    {day}
                  </ChipToggle>
                ))}
              </div>
            </FormField>
          </div>
        </Card>

        {!isEditing && (
          <Card title="Equipment" description="Select equipment available in this room. You can edit this later.">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {eqTypes?.data?.map((eq: any) => {
                const existingIdx = eqFields.findIndex(f => (f as any).code === eq.code);
                const isSelected = existingIdx >= 0;
                
                return (
                  <div key={eq.code} className={`border rounded-card p-4 flex flex-col gap-3 transition-colors ${isSelected ? 'border-primary bg-primary-50/30' : 'border-line bg-surface'}`}>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-body text-ink">{eq.name}</span>
                      </div>
                      <Switch checked={isSelected} onChange={() => {
                        if (isSelected) removeEq(existingIdx);
                        else appendEq({ code: eq.code, quantity: 1, status: 'WORKING' });
                      }} />
                    </div>
                    {isSelected && (
                      <div className="flex items-center justify-between mt-2 pt-2 border-t border-line/40">
                        <span className="text-small text-muted">Quantity</span>
                        <div className="flex items-center border border-line rounded-control h-8 bg-surface">
                          <button type="button" onClick={() => setValue(`equipment.${existingIdx}.quantity`, Math.max(1, (watch(`equipment.${existingIdx}.quantity`) || 1) - 1))} className="px-2 text-muted hover:text-ink">-</button>
                          <span className="px-2 text-small w-6 text-center">{watch(`equipment.${existingIdx}.quantity`)}</span>
                          <button type="button" onClick={() => setValue(`equipment.${existingIdx}.quantity`, (watch(`equipment.${existingIdx}.quantity`) || 1) + 1)} className="px-2 text-muted hover:text-ink">+</button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </Card>
        )}
      </div>

      <div className="fixed bottom-0 left-0 right-0 sm:left-64 p-4 bg-surface border-t border-line/60 shadow-[0_-4px_16px_rgba(7,26,61,0.05)] z-40 flex justify-end gap-3">
        <Button type="button" variant="secondary" onClick={handleCancel}>Cancel</Button>
        <Button type="submit" loading={createRoom.isPending || updateRoom.isPending}>Save Room</Button>
      </div>
    </form>
  );
}
