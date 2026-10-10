"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function RoomDetailsPage({ params }: { params: { id: string } }) {
  const [slots, setSlots] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const date = new Date().toISOString().slice(0, 10);

  useEffect(() => {
    fetchApi(`/rooms/${params.id}/availability?date=${date}`, { headers: { 'Authorization': `Bearer stub-token` } })
      .then((res: any) => setSlots(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id, date]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Room {params.id}</h1>
        <Button onClick={() => router.push('/client/search')}>Back to Search</Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Availability on {date}</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div>Loading...</div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-2">
              {slots.map(s => {
                const time = new Date(s.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                let color = 'bg-green-100 text-green-800 border-green-200';
                if (s.state === 'BOOKED' || s.state === 'HELD') color = 'bg-red-100 text-red-800 border-red-200 opacity-50';
                if (s.state === 'PAST' || s.state === 'CLOSED') color = 'bg-gray-100 text-gray-800 border-gray-200 opacity-50';
                if (s.state === 'BLACKOUT') color = 'bg-yellow-100 text-yellow-800 border-yellow-200 opacity-50';
                return (
                  <div key={s.startAt} className={`p-2 rounded border text-center text-xs font-medium ${color}`}>
                    {time}<br />{s.state}
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
