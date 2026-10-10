'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
// import { api } from '@/core/api/client';
// import { Button, ErrorState, Spinner, StatusBadge } from '@/design-system';

export default function CheckinPage({ token }: { token: string }) {
  const router = useRouter();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // In a real app we'd use TanStack Query and api.get
    // For this standalone part without the design-system skeleton:
    fetch(`http://localhost:4000/api/v1/checkin/resolve/${token}`)
      .then(res => res.json())
      .then(res => {
        if (!res.success) throw new Error(res.error?.message || 'Failed to resolve token');
        setData(res.data);
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleScan = async () => {
    try {
      setLoading(true);
      const res = await fetch(`http://localhost:4000/api/v1/checkin/scan`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      }).then(r => r.json());

      if (!res.success) throw new Error(res.error?.message || 'Check-in failed');
      
      // Reload state
      window.location.reload();
    } catch (err: any) {
      setError(err.message);
      setLoading(false);
    }
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (error) return <div className="p-8 text-center text-red-600">Error: {error}</div>;
  if (!data) return <div className="p-8 text-center">Not found</div>;

  const { room, window: checkinWindow, state, booking } = data;

  return (
    <div className="max-w-md mx-auto p-4 md:p-8 mt-12 bg-white rounded-xl shadow-sm border border-slate-200">
      <div className="text-center mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Check-in</h1>
        {room && (
          <div className="text-slate-600">
            <p className="font-medium text-slate-800">{room.name}</p>
            <p className="text-sm">{room.location} {room.floor ? `· Floor ${room.floor}` : ''}</p>
          </div>
        )}
      </div>

      {state === 'INVALID_TOKEN' && (
        <div className="bg-red-50 text-red-800 p-4 rounded-lg text-center">
          This QR code is invalid or has expired.
        </div>
      )}

      {state === 'NO_BOOKING' && (
        <div className="text-center">
          <p className="text-slate-600 mb-4">You don't have a booking here right now.</p>
          <button onClick={() => router.push('/client/search')} className="bg-blue-600 text-white px-4 py-2 rounded-lg w-full">
            Find a room
          </button>
        </div>
      )}

      {state === 'ALREADY_CHECKED_IN' && (
        <div className="bg-green-50 border border-green-200 text-green-800 p-6 rounded-xl text-center">
          <div className="text-4xl mb-4">✅</div>
          <h2 className="text-xl font-bold mb-2">Checked In</h2>
          <p>Enjoy your meeting!</p>
          {booking && (
            <div className="mt-4 pt-4 border-t border-green-200 text-sm">
              <p className="font-medium">{booking.title}</p>
              <p>{new Date(booking.startAt).toLocaleTimeString()} - {new Date(booking.endAt).toLocaleTimeString()}</p>
            </div>
          )}
        </div>
      )}

      {state === 'OPEN' && (
        <div className="text-center">
          {booking && (
            <div className="mb-6 text-left bg-slate-50 p-4 rounded-lg border border-slate-100">
              <h3 className="font-semibold text-slate-800">{booking.title}</h3>
              <p className="text-sm text-slate-500 mb-2">
                {new Date(booking.startAt).toLocaleTimeString()} - {new Date(booking.endAt).toLocaleTimeString()}
              </p>
            </div>
          )}
          <button 
            onClick={handleScan}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-4 rounded-xl text-lg transition-colors shadow-sm"
          >
            Check in now
          </button>
        </div>
      )}

      {state === 'TOO_EARLY' && checkinWindow && (
        <div className="bg-amber-50 text-amber-800 p-6 rounded-xl text-center border border-amber-200">
          <h2 className="text-lg font-semibold mb-2">Too Early</h2>
          <p>Check-in opens at {new Date(checkinWindow.opensAt).toLocaleTimeString()}</p>
        </div>
      )}

      {state === 'WINDOW_CLOSED' && (
        <div className="bg-slate-50 text-slate-600 p-6 rounded-xl text-center">
          <h2 className="text-lg font-semibold mb-2">Window Closed</h2>
          <p>The check-in window for this booking has closed.</p>
        </div>
      )}

      {state === 'RELEASED' && (
        <div className="bg-red-50 text-red-800 p-6 rounded-xl text-center border border-red-200">
          <h2 className="text-lg font-semibold mb-2">Room Released</h2>
          <p className="mb-4">This booking was released because nobody checked in on time.</p>
          <button onClick={() => router.push('/client/search')} className="text-blue-600 font-medium">
            Find another room
          </button>
        </div>
      )}
    </div>
  );
}
