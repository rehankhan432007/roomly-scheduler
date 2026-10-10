"use client";
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { format, parseISO } from 'date-fns';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export default function BookingDetailsPage({ params }: { params: { id: string } }) {
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    fetchApi(`/bookings/${params.id}`, { headers: { 'Authorization': `Bearer stub-token` } })
      .then((res: any) => setBooking(res))
      .catch(() => router.push('/client/bookings'))
      .finally(() => setLoading(false));
  }, [params.id, router]);

  const handleCancel = async () => {
    if (!confirm('Cancel this booking?')) return;
    try {
      const res = await fetchApi(`/bookings/${params.id}/cancel`, { method: 'POST', headers: { 'Authorization': `Bearer stub-token` } });
      setBooking(res);
    } catch (e: any) {
      alert(`Cancel failed: ${e.message}`);
    }
  };

  if (loading) return <div>Loading...</div>;
  if (!booking) return <div>Not found</div>;

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{booking.title}</h1>
          <p className="text-muted-foreground mt-1">Booking ID: {booking.id}</p>
        </div>
        <Badge className="text-lg px-4 py-1" variant={booking.status === 'CONFIRMED' ? 'default' : 'secondary'}>{booking.status}</Badge>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="text-sm text-muted-foreground">When</div>
              <div className="font-medium">
                {format(parseISO(booking.startAt), 'EEEE, MMMM d, yyyy')}
                <br />
                {format(parseISO(booking.startAt), 'h:mm a')} - {format(parseISO(booking.endAt), 'h:mm a')}
              </div>
            </div>
            <div>
              <div className="text-sm text-muted-foreground">Room ID</div>
              <div className="font-medium">{booking.roomId}</div>
            </div>
            <div className="flex gap-4">
              <div>
                <div className="text-sm text-muted-foreground">Attendees</div>
                <div className="font-medium">{booking.attendeeCount}</div>
              </div>
              <div>
                <div className="text-sm text-muted-foreground">Total Price</div>
                <div className="font-medium">₹{booking.totalPrice}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {booking.status === 'CONFIRMED' && (
              <>
                <Button variant="destructive" className="w-full" onClick={handleCancel}>Cancel Booking</Button>
                {/* Reschedule could go here, omitting for brevity */}
              </>
            )}
            {booking.status === 'CANCELLED' && (
              <div className="text-sm text-muted-foreground">Cancelled on {booking.cancelledAt && format(parseISO(booking.cancelledAt), 'PPp')}</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
