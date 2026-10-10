"use client";
import { useEffect, useState } from 'react';
import { fetchApi } from '@/lib/api';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format, parseISO, startOfWeek, addDays } from 'date-fns';

export default function CalendarPage() {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchApi('/me/calendar', { headers: { 'Authorization': `Bearer stub-token` } })
      .then((res: any) => setBookings(res))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const today = new Date();
  const weekStart = startOfWeek(today, { weekStartsOn: 1 });
  const days = Array.from({ length: 7 }, (_, i) => addDays(weekStart, i));

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold tracking-tight">My Calendar</h1>
      
      {loading ? (
        <div>Loading...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-7 gap-4">
          {days.map(d => {
            const dayBookings = bookings.filter(b => parseISO(b.startAt).toDateString() === d.toDateString());
            return (
              <Card key={d.toISOString()} className={d.toDateString() === today.toDateString() ? 'border-primary ring-1 ring-primary' : ''}>
                <CardContent className="p-4 space-y-4">
                  <div className="text-center">
                    <div className="text-sm font-medium text-muted-foreground">{format(d, 'EEE')}</div>
                    <div className="text-2xl font-bold">{format(d, 'd')}</div>
                  </div>
                  <div className="space-y-2">
                    {dayBookings.map(b => (
                      <div key={b.id} className="text-xs bg-muted p-2 rounded-md">
                        <div className="font-semibold truncate">{b.title}</div>
                        <div className="text-muted-foreground">{format(parseISO(b.startAt), 'HH:mm')} - {format(parseISO(b.endAt), 'HH:mm')}</div>
                        <Badge variant="outline" className="mt-1">{b.status}</Badge>
                      </div>
                    ))}
                    {dayBookings.length === 0 && (
                      <div className="text-xs text-center text-muted-foreground py-4">No events</div>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
