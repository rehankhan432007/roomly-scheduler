import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from './api';

export function useLocations() {
  return useQuery({ queryKey: ['locations'], queryFn: api.getLocations });
}

export function useCreateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useUpdateLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.updateLocation(id, data),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useDeleteLocation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteLocation,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['locations'] }),
  });
}

export function useRooms(filters: any) {
  return useQuery({ queryKey: ['rooms', filters], queryFn: () => api.getRooms(filters) });
}

export function useRoom(id: string) {
  return useQuery({ queryKey: ['rooms', id], queryFn: () => api.getRoom(id), enabled: !!id });
}

export function useCreateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.createRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useUpdateRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string, data: any }) => api.updateRoom(id, data),
    onSuccess: (_, { id }) => {
      qc.invalidateQueries({ queryKey: ['rooms'] });
      qc.invalidateQueries({ queryKey: ['rooms', id] });
    },
  });
}

export function useDeleteRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.deleteRoom,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rooms'] }),
  });
}

export function useEquipmentTypes() {
  return useQuery({ queryKey: ['equipment-types'], queryFn: api.getEquipmentTypes });
}

export function usePatchEquipment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, code, data }: { roomId: string, code: string, data: any }) => api.patchEquipment(roomId, code, data),
    onSuccess: (_, { roomId }) => qc.invalidateQueries({ queryKey: ['rooms', roomId] }),
  });
}

export function useBlackouts(roomId: string) {
  return useQuery({ queryKey: ['blackouts', roomId], queryFn: () => api.getBlackouts(roomId), enabled: !!roomId });
}

export function useCreateBlackout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, data }: { roomId: string, data: any }) => api.createBlackout(roomId, data),
    onSuccess: (_, { roomId }) => qc.invalidateQueries({ queryKey: ['blackouts', roomId] }),
  });
}

export function useDeleteBlackout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ roomId, blackoutId }: { roomId: string, blackoutId: string }) => api.deleteBlackout(roomId, blackoutId),
    onSuccess: (_, { roomId }) => qc.invalidateQueries({ queryKey: ['blackouts', roomId] }),
  });
}

export function useDashboard(range: string) {
  return useQuery({ queryKey: ['dashboard', range], queryFn: () => api.getDashboard(range) });
}

export function useOwnerBookings(filters: any) {
  return useQuery({ queryKey: ['owner-bookings', filters], queryFn: () => api.getBookings(filters) });
}

export function useQr(roomId: string) {
  return useQuery({ queryKey: ['qr', roomId], queryFn: () => api.getQr(roomId), enabled: !!roomId });
}

export function useRotateQr() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: api.rotateQr,
    onSuccess: (_, roomId) => qc.invalidateQueries({ queryKey: ['qr', roomId] }),
  });
}
