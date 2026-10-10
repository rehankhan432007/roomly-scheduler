import RoomFormPage from '@/features/inventory/pages/RoomFormPage';

export default function Page({ params }: { params: { id: string } }) {
  return <RoomFormPage roomId={params.id} />;
}
