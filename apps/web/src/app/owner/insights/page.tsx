'use client';

import InsightsPage from '../../../features/experience/pages/InsightsPage';
import { useState } from 'react';

export default function InsightsRoute() {
  const [locationId, setLocationId] = useState('b0000000-0000-4000-8000-000000000001'); // Indiranagar

  return (
    <div className="bg-slate-50 min-h-screen">
      <div className="bg-white border-b border-slate-200 p-4">
        <div className="max-w-6xl mx-auto flex items-center gap-4">
          <label className="font-semibold text-slate-700">Location:</label>
          <select 
            value={locationId} 
            onChange={e => setLocationId(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 focus:ring-2 focus:ring-blue-500 outline-none"
          >
            <option value="b0000000-0000-4000-8000-000000000001">Indiranagar Hub</option>
            <option value="b0000000-0000-4000-8000-000000000002">Koramangala Tower</option>
          </select>
        </div>
      </div>
      
      <div className="max-w-6xl mx-auto">
        <InsightsPage locationId={locationId} />
      </div>
    </div>
  );
}
