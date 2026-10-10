'use client';

import NotificationBell from '../../features/experience/components/NotificationBell';

export default function NotificationsPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto mt-20">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">Notifications Demo</h1>
          <p className="text-slate-600">Click the bell icon to view your real-time notifications.</p>
        </div>
        
        <div className="bg-white p-2 rounded-full border border-slate-200 shadow-sm">
          <NotificationBell />
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm text-center">
        <h3 className="font-semibold text-slate-800 mb-4">Background Jobs</h3>
        <p className="text-slate-600 mb-4">
          The backend runs automated jobs that generate these notifications:
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-left max-w-2xl mx-auto">
          <div className="p-4 bg-blue-50 rounded-lg border border-blue-100">
            <div className="font-semibold text-blue-900 mb-1">Booking Reminders</div>
            <div className="text-sm text-blue-800">Sent 15 minutes before a confirmed booking starts, reminding the user to check in.</div>
          </div>
          <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
            <div className="font-semibold text-purple-900 mb-1">Review Requests</div>
            <div className="text-sm text-purple-800">Sent shortly after a checked-in booking ends to collect feedback.</div>
          </div>
          <div className="p-4 bg-red-50 rounded-lg border border-red-100">
            <div className="font-semibold text-red-900 mb-1">Auto-Release Warnings</div>
            <div className="text-sm text-red-800">Sent when a room is automatically released due to a no-show.</div>
          </div>
          <div className="p-4 bg-amber-50 rounded-lg border border-amber-100">
            <div className="font-semibold text-amber-900 mb-1">Issue Alerts</div>
            <div className="text-sm text-amber-800">Sent to owners when a user reports a broken projector or messy room.</div>
          </div>
        </div>
      </div>
    </div>
  );
}
