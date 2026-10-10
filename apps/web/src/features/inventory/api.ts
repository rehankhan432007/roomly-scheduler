import { apiClient } from '@/core/api/client';
import type { CreateRoomInput, UpdateRoomInput, CreateLocationInput, UpdateLocationInput } from '@meetmaze/shared/modules/rooms';
import type { RoomSummary } from '@meetmaze/shared/contracts';

export const api = {
  // Locations
  getLocations: () => apiClient.get<any[]>('/owner/locations'),
  createLocation: (data: CreateLocationInput) => apiClient.post<any>('/owner/locations', data),
  updateLocation: (id: string, data: UpdateLocationInput) => apiClient.patch<any>(`/owner/locations/${id}`, data),
  deleteLocation: (id: string) => apiClient.delete<{deleted:boolean}>(`/owner/locations/${id}`),

  // Rooms
  getRooms: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return apiClient.get<any>(`/owner/rooms?${q}`);
  },
  getRoom: (id: string) => apiClient.get<any>(`/owner/rooms/${id}`),
  createRoom: (data: CreateRoomInput) => apiClient.post<RoomSummary>('/owner/rooms', data),
  updateRoom: (id: string, data: UpdateRoomInput) => apiClient.patch<RoomSummary>(`/owner/rooms/${id}`, data),
  deleteRoom: (id: string) => apiClient.delete<{deleted:boolean}>(`/owner/rooms/${id}`),

  // Equipment
  getEquipmentTypes: () => apiClient.get<any[]>('/equipment-types'),
  replaceEquipment: (roomId: string, data: any) => apiClient.put<any[]>(`/owner/rooms/${roomId}/equipment`, data),
  patchEquipment: (roomId: string, code: string, data: any) => apiClient.patch<any[]>(`/owner/rooms/${roomId}/equipment/${code}`, data),

  // Blackouts
  getBlackouts: (roomId: string) => apiClient.get<any[]>(`/owner/rooms/${roomId}/blackouts`),
  createBlackout: (roomId: string, data: any) => apiClient.post<any>(`/owner/rooms/${roomId}/blackouts`, data),
  deleteBlackout: (roomId: string, blackoutId: string) => apiClient.delete<{deleted:boolean}>(`/owner/rooms/${roomId}/blackouts/${blackoutId}`),

  // QR
  getQr: (roomId: string) => apiClient.get<{checkinUrl:string, token:string, svg:string}>(`/owner/rooms/${roomId}/qr`),
  rotateQr: (roomId: string) => apiClient.post<{checkinUrl:string, token:string, svg:string}>(`/owner/rooms/${roomId}/qr/rotate`),

  // Dashboard & Bookings
  getDashboard: (range: string = '7d') => apiClient.get<any>(`/owner/dashboard?range=${range}`),
  getBookings: (params?: any) => {
    const q = new URLSearchParams(params || {}).toString();
    return apiClient.get<any>(`/owner/bookings?${q}`);
  }
};
