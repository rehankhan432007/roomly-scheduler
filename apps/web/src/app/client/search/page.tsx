"use client";
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { fetchApi } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Search, MapPin, Users, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { useStore } from '@/lib/store';
import { addHours, formatISO } from 'date-fns';

export default function SearchPage() {
  const [date, setDate] = useState(() => formatISO(new Date()).slice(0, 10));
  const [time, setTime] = useState('10:00');
  const [duration, setDuration] = useState(60);
  const [attendees, setAttendees] = useState(2);
  const [city, setCity] = useState('Bengaluru');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>(null);
  const router = useRouter();
  const { user } = useStore();

  const handleSearch = async () => {
    setLoading(true);
    setResults(null);
    try {
      const startAt = new Date(`${date}T${time}:00`).toISOString();
      const endAt = addHours(new Date(`${date}T${time}:00`), duration / 60).toISOString();
      
      const payload = {
        startAt,
        endAt,
        attendeeCount: attendees,
        city,
        limit: 10
      };

      const res = await fetchApi('/search/rooms', {
        method: 'POST',
        body: JSON.stringify(payload),
        headers: { 'Authorization': `Bearer stub-token-for-${user?.id}` } // Note: real auth uses cookies normally
      });
      setResults(res);
    } catch (e) {
      console.error(e);
      alert('Search failed');
    } finally {
      setLoading(false);
    }
  };

  const bookRoom = async (roomId: string, matchScore: number, matchReason: string) => {
    const startAt = new Date(`${date}T${time}:00`).toISOString();
    const endAt = addHours(new Date(`${date}T${time}:00`), duration / 60).toISOString();
    try {
      const res = await fetchApi('/bookings', {
        method: 'POST',
        body: JSON.stringify({
          roomId,
          title: 'Ad-hoc Booking',
          startAt,
          endAt,
          attendeeCount: attendees,
          matchScore,
          matchReason
        }),
      });
      router.push(`/client/bookings/${(res as any).id}`);
    } catch (e: any) {
      alert(`Booking failed: ${e.message}`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold tracking-tight">Find a Room</h1>
      </div>

      <Card>
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="space-y-2">
              <label className="text-sm font-medium">City</label>
              <Input type="text" value={city} onChange={e => setCity(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Date</label>
              <Input type="date" value={date} onChange={e => setDate(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Time</label>
              <Input type="time" value={time} onChange={e => setTime(e.target.value)} />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Attendees</label>
              <Input type="number" value={attendees} onChange={e => setAttendees(parseInt(e.target.value))} />
            </div>
            <Button onClick={handleSearch} disabled={loading} className="w-full">
              {loading ? 'Searching...' : <><Search className="mr-2 h-4 w-4" /> Search</>}
            </Button>
          </div>
        </CardContent>
      </Card>

      {results?.busyWarning && (
        <div className="bg-yellow-50 text-yellow-900 p-4 rounded-md border border-yellow-200 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5 shrink-0" />
          <div>
            <h4 className="font-semibold text-sm">High Demand Warning</h4>
            <p className="text-sm">{results.busyWarning.message}</p>
          </div>
        </div>
      )}

      {results && (
        <div className="grid grid-cols-1 gap-4">
          {results.matches.map((m: any, i: number) => (
            <Card key={m.room.id} className={m.availability === 'FREE' ? 'border-green-200' : 'opacity-75'}>
              <CardContent className="p-6 flex flex-col md:flex-row gap-6">
                <div className="w-full md:w-1/4 h-32 bg-muted rounded-md flex items-center justify-center">
                  <span className="text-muted-foreground">No Photo</span>
                </div>
                <div className="flex-1 space-y-2">
                  <div className="flex justify-between items-start">
                    <div>
                      <h3 className="font-semibold text-xl">{m.room.name}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {m.room.locationName} ({m.room.city})
                      </p>
                    </div>
                    <Badge variant={m.availability === 'FREE' ? 'default' : 'destructive'}>
                      {m.availability}
                    </Badge>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 text-sm text-muted-foreground pt-2">
                    <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md"><Users className="w-3 h-3"/> {m.room.capacity} seats</span>
                    <span className="flex items-center gap-1 bg-muted px-2 py-1 rounded-md"><Zap className="w-3 h-3 text-amber-500"/> {m.matchScore}% Match</span>
                    <span className="bg-muted px-2 py-1 rounded-md">₹{m.room.hourlyPrice}/hr</span>
                  </div>

                  <p className="text-sm bg-blue-50 text-blue-900 p-2 rounded-md mt-2 flex gap-2 items-start">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0" />
                    {m.matchReason}
                  </p>
                </div>
                <div className="flex flex-col justify-end gap-2 md:w-48">
                  {m.availability === 'FREE' ? (
                    <Button onClick={() => bookRoom(m.room.id, m.matchScore, m.matchReason)}>Book Now</Button>
                  ) : (
                    <Button variant="secondary" disabled>Unavailable</Button>
                  )}
                  <Button variant="outline" onClick={() => router.push(`/client/rooms/${m.room.id}`)}>View Details</Button>
                </div>
              </CardContent>
            </Card>
          ))}
          {results.matches.length === 0 && (
            <div className="text-center py-12 bg-card rounded-lg border">
              <h3 className="text-lg font-medium text-muted-foreground">No rooms found</h3>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
