'use client';

import RoomBotLauncher from '../../../features/experience/components/RoomBotLauncher';

export default function RoomBotPage() {
  return (
    <div className="p-8 max-w-4xl mx-auto text-center mt-20">
      <h1 className="text-3xl font-bold text-slate-900 mb-4">RoomBot Demo</h1>
      <p className="text-lg text-slate-600 mb-8">
        Click the floating button in the bottom right corner to start chatting with RoomBot!
      </p>
      
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm text-left max-w-md mx-auto">
        <h3 className="font-semibold text-slate-800 mb-2">Try saying:</h3>
        <ul className="list-disc pl-5 space-y-2 text-slate-600">
          <li>"Book a room for 8 people tomorrow at 3 PM with a projector"</li>
          <li>"What's free this afternoon?"</li>
          <li>"Show my bookings"</li>
          <li>"Cancel my next meeting"</li>
        </ul>
      </div>

      <RoomBotLauncher />
    </div>
  );
}
