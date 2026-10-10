import RoomDetailPage from '@/features/inventory/pages/RoomDetailPage';

export default function Page({ params }: { params: { id: string } }) {
  return <RoomDetailPage roomId={params.id} />;
}
