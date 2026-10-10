'use client';

import React, { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
// import { api } from '@/core/api/client';

export default function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<any[]>([]);

  const load = () => {
    fetch('http://localhost:4000/api/v1/notifications?unread=true')
      .then(r => r.json())
      .then(res => {
        if (res.success) {
          setNotifications(res.data);
          setUnreadCount(res.meta?.unreadCount || 0);
        }
      })
      .catch(console.error);
  };

  useEffect(() => {
    load();
    const interval = setInterval(load, 30000); // poll every 30s
    return () => clearInterval(interval);
  }, []);

  const markRead = async (id: string) => {
    try {
      await fetch(`http://localhost:4000/api/v1/notifications/${id}/read`, { method: 'POST' });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  const markAllRead = async () => {
    try {
      await fetch(`http://localhost:4000/api/v1/notifications/read-all`, { method: 'POST' });
      load();
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className="relative">
      <button 
        onClick={() => { setOpen(!open); if (!open) load(); }}
        className="relative p-2 text-slate-600 hover:text-slate-900 transition-colors rounded-full hover:bg-slate-100"
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-slate-200 shadow-xl rounded-xl overflow-hidden z-50">
          <div className="p-3 border-b border-slate-100 flex justify-between items-center bg-slate-50">
            <h3 className="font-semibold text-slate-800">Notifications</h3>
            {unreadCount > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                Mark all read
              </button>
            )}
          </div>
          
          <div className="max-h-[400px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-sm">
                No new notifications
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {notifications.map(n => (
                  <div key={n.id} className="p-4 hover:bg-slate-50 transition-colors cursor-pointer" onClick={() => markRead(n.id)}>
                    <div className="flex justify-between items-start mb-1">
                      <h4 className="text-sm font-semibold text-slate-800">{n.title}</h4>
                      {!n.readAt && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1.5 shrink-0"></span>}
                    </div>
                    <p className="text-sm text-slate-600 line-clamp-2">{n.body}</p>
                    <span className="text-xs text-slate-400 mt-2 block">
                      {new Date(n.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
