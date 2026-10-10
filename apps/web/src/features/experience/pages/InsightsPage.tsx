'use client';

import React, { useState, useEffect } from 'react';
// import { api } from '@/core/api/client';

const DOW_NAMES = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const HOURS = Array.from({ length: 15 }, (_, i) => i + 7); // 7 AM to 9 PM

export default function InsightsPage({ locationId }: { locationId: string }) {
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`http://localhost:4000/api/v1/owner/insights/heatmap?locationId=${locationId}`, {
      // requires OWNER auth token in real app
    })
      .then(r => r.json())
      .then(res => {
        if (res.success) setData(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [locationId]);

  if (loading) return <div>Loading insights...</div>;
  if (!data) return <div>No data available.</div>;

  const getCellColor = (fillRate: number) => {
    if (fillRate === 0) return 'bg-slate-50 border-slate-100 text-transparent hover:text-slate-400';
    if (fillRate < 25) return 'bg-green-100 border-green-200 text-green-700';
    if (fillRate < 50) return 'bg-green-200 border-green-300 text-green-800';
    if (fillRate < 75) return 'bg-amber-200 border-amber-300 text-amber-800';
    return 'bg-red-300 border-red-400 text-red-900 font-semibold';
  };

  const cellMap = new Map();
  data.cells.forEach((c: any) => cellMap.set(`${c.dow}-${c.hour}`, c.fillRate));

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">Demand Insights</h1>
      <p className="text-slate-600 mb-8">Heatmap showing utilization over the last 8 weeks.</p>

      {data.suggestions.length > 0 && (
        <div className="bg-blue-50 border border-blue-100 rounded-xl p-5 mb-8">
          <h3 className="font-semibold text-blue-900 mb-3 flex items-center gap-2">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9.3 14.7l4.4-4.4"/><path d="M10 9a3 3 0 1 0 0 6 3 3 0 1 0 0-6z"/><path d="M14 9a3 3 0 1 1 0 6 3 3 0 1 1 0-6z"/></svg>
            AI Suggestions
          </h3>
          <ul className="space-y-2 text-sm text-blue-800">
            {data.suggestions.map((s: string, i: number) => (
              <li key={i} className="flex gap-2"><span className="text-blue-400">•</span> {s}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="overflow-x-auto bg-white rounded-xl shadow-sm border border-slate-200 p-6">
        <div className="min-w-[800px]">
          {/* Header row (Hours) */}
          <div className="flex mb-2">
            <div className="w-16 shrink-0"></div>
            {HOURS.map(h => (
              <div key={h} className="flex-1 text-center text-xs font-medium text-slate-500">
                {h > 12 ? `${h - 12}P` : h === 12 ? '12P' : `${h}A`}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="space-y-1">
            {DOW_NAMES.map((day, i) => {
              const dow = i + 1;
              return (
                <div key={dow} className="flex items-center">
                  <div className="w-16 shrink-0 text-sm font-medium text-slate-600">{day}</div>
                  {HOURS.map(hour => {
                    const fill = cellMap.get(`${dow}-${hour}`) || 0;
                    return (
                      <div key={`${dow}-${hour}`} className="flex-1 p-[1px]">
                        <div 
                          className={`h-10 rounded border flex items-center justify-center text-xs transition-colors ${getCellColor(fill)}`}
                          title={`${day} at ${hour}:00 — ${fill}% full`}
                        >
                          {fill > 0 ? Math.round(fill) + '%' : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-end gap-4 mt-6 text-xs text-slate-500">
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-slate-50 border border-slate-100"></div> 0%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-100 border border-green-200"></div> &lt;25%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-green-200 border border-green-300"></div> &lt;50%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-amber-200 border border-amber-300"></div> &lt;75%</div>
          <div className="flex items-center gap-1"><div className="w-3 h-3 rounded bg-red-300 border border-red-400"></div> 75%+</div>
        </div>
      </div>
    </div>
  );
}
