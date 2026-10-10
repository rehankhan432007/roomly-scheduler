"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { format, parseISO } from 'date-fns';
import { useStore } from '@/lib/store';

export default function BookingsPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [scope, setScope] = useState('upcoming');
  const router = useRouter();
  const { user } = useStore();

  useEffect(() => {
    fetchApi(`/bookings?scope=${scope}`, { headers: { 'Authorization': `Bearer stub-token` } })
      .then((res: any) => setBookings(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [scope]);

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Bookings</h1>
      
      <Tabs value={scope} onValueChange={(v) => { setScope(v); setLoading(true); }}>
        <TabsList>
          <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
          <TabsTrigger value="past">Past</TabsTrigger>
          <TabsTrigger value="cancelled">Cancelled</TabsTrigger>
        </TabsList>
      </Tabs>

      {loading ? (
        <div>Loading...</div>
      ) : bookings.length === 0 ? (
        <div className="text-center py-12 bg-card rounded-lg border">
          <h3 className="text-lg font-medium text-muted-foreground">No bookings found</h3>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {bookings.map(b => (
            <Card key={b.id} className="cursor-pointer hover:border-primary transition-colors" onClick={() => router.push(`/client/bookings/${b.id}`)}>
              <CardContent className="p-6 space-y-4">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">
                      {format(parseISO(b.startAt), 'MMM d, yyyy h:mm a')} - {format(parseISO(b.endAt), 'h:mm a')}
                    </p>
                  </div>
                  <Badge variant={b.status === 'CONFIRMED' || b.status === 'COMPLETED' ? 'default' : 'secondary'}>
                    {b.status}
                  </Badge>
                </div>
                <div className="text-sm">
                  <span className="font-medium">Room ID:</span> {b.roomId}
                </div>
                <div className="flex gap-2">
                  <Badge variant="outline">{b.attendeeCount} Attendees</Badge>
                  <Badge variant="outline">₹{b.totalPrice}</Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
