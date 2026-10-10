'use client';
import React, { useState } from 'react';
import { PageHeader, Card, Button, DataTable, Modal, FormField, Input, ErrorState, Spinner } from '@/design-system';
import { useLocations, useCreateLocation, useUpdateLocation, useDeleteLocation } from '../hooks';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { createLocationSchema, updateLocationSchema } from '@meetmaze/shared/modules/rooms';
import { toast } from 'sonner';

export default function LocationsPage() {
  const { data: locations, isLoading, error, refetch } = useLocations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingLoc, setEditingLoc] = useState<any>(null);
  
  const createLoc = useCreateLocation();
  const updateLoc = useUpdateLocation();
  const deleteLoc = useDeleteLocation();

  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(editingLoc ? updateLocationSchema : createLocationSchema),
    defaultValues: editingLoc || { name: '', addressLine: '', city: '', state: '', country: 'India', timezone: 'Asia/Kolkata' }
  });

  const onSubmit = async (data: any) => {
    try {
      if (editingLoc) {
        await updateLoc.mutateAsync({ id: editingLoc.id, data });
        toast.success('Location updated');
      } else {
        await createLoc.mutateAsync(data);
        toast.success('Location created');
      }
      setModalOpen(false);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save location');
    }
  };

  const handleEdit = (loc: any) => {
    setEditingLoc(loc);
    reset(loc);
    setModalOpen(true);
  };

  const handleCreate = () => {
    setEditingLoc(null);
    reset({ name: '', addressLine: '', city: '', state: '', country: 'India', timezone: 'Asia/Kolkata' });
    setModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this location?')) {
      try {
        await deleteLoc.mutateAsync(id);
        toast.success('Location deleted');
      } catch (e: any) {
        toast.error(e.message || 'Failed to delete location');
      }
    }
  };

  if (isLoading) return <div className="p-8 flex justify-center"><Spinner size="lg" /></div>;
  if (error) return <ErrorState message="Failed to load locations" onRetry={refetch} />;

  return (
    <div className="max-w-5xl mx-auto py-8">
      <PageHeader
        title="Locations"
        description="Manage your buildings and properties."
        actions={<Button onClick={handleCreate}>Add Location</Button>}
      />

      <DataTable
        columns={[
          { key: 'name', header: 'Name', render: (l) => <span className="font-medium">{l.name}</span> },
          { key: 'city', header: 'City / Region', render: (l) => `${l.city}${l.state ? `, ${l.state}` : ''}` },
          { key: 'timezone', header: 'Timezone' },
          { key: 'actions', header: '', align: 'right', render: (l) => (
            <div className="flex gap-2 justify-end">
              <Button variant="ghost" size="sm" onClick={() => handleEdit(l)}>Edit</Button>
              <Button variant="ghost" size="sm" className="text-danger" onClick={() => handleDelete(l.id)}>Delete</Button>
            </div>
          )}
        ]}
        rows={locations || []}
        rowKey={(l) => l.id}
        empty={<p className="p-6 text-center text-muted">No locations added yet.</p>}
      />

      <Modal open={modalOpen} onClose={() => setModalOpen(false)} title={editingLoc ? 'Edit Location' : 'Add Location'}>
        <form id="loc-form" onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <FormField label="Name" error={errors.name?.message as string} required>
            <Input {...register('name')} placeholder="e.g. Indiranagar Hub" />
          </FormField>
          <FormField label="Address Line" error={errors.addressLine?.message as string} required>
            <Input {...register('addressLine')} />
          </FormField>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="City" error={errors.city?.message as string} required>
              <Input {...register('city')} />
            </FormField>
            <FormField label="State" error={errors.state?.message as string}>
              <Input {...register('state')} />
            </FormField>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <FormField label="Country" error={errors.country?.message as string} required>
              <Input {...register('country')} />
            </FormField>
            <FormField label="Timezone" error={errors.timezone?.message as string} required>
              <Input {...register('timezone')} />
            </FormField>
          </div>
          
          <div className="pt-4 flex justify-end gap-3 border-t border-line/60 mt-6">
            <Button type="button" variant="secondary" onClick={() => setModalOpen(false)}>Cancel</Button>
            <Button type="submit" loading={createLoc.isPending || updateLoc.isPending}>Save</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
