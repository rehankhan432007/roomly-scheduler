'use client';

import CheckinPage from '../../../features/experience/pages/CheckinPage';
import { useState } from 'react';
import { QrCode } from 'lucide-react';

export default function CheckinDemo() {
  const [token, setToken] = useState('qr-aurora-token-001'); // default to aurora
  const [activeToken, setActiveToken] = useState<string | null>(null);

  if (activeToken) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col">
        <div className="p-4">
          <button 
            onClick={() => setActiveToken(null)}
            className="text-sm font-medium text-blue-600 hover:text-blue-800"
          >
            &larr; Back to scanner
          </button>
        </div>
        <CheckinPage token={activeToken} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-8">
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 max-w-md w-full text-center">
        <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <QrCode size={32} />
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Scan QR Code</h1>
        <p className="text-slate-600 mb-8">
          In the real app, this would be a camera scanner. For this demo, pick a room token to simulate scanning its QR code.
        </p>

        <select 
          value={token} 
          onChange={e => setToken(e.target.value)}
          className="w-full bg-slate-50 border border-slate-200 rounded-lg px-4 py-3 mb-6 focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="qr-aurora-token-001">Aurora Boardroom (Indiranagar)</option>
          <option value="qr-spark-token-002">Spark Huddle (Indiranagar)</option>
          <option value="qr-zen-token-003">Zen Pod (Indiranagar)</option>
          <option value="qr-summit-token-004">Summit Hall (Koramangala)</option>
          <option value="qr-ideation-token-005">Ideation Studio (Koramangala)</option>
          <option value="qr-atlas-token-006">Atlas Room (Koramangala)</option>
          <option value="invalid-token">Fake Invalid QR</option>
        </select>

        <button 
          onClick={() => setActiveToken(token)}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-lg transition-colors"
        >
          Simulate Scan
        </button>
      </div>
    </div>
  );
}
