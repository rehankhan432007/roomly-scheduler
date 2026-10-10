'use client';

import React, { useState, useEffect } from 'react';
// import { api } from '@/core/api/client';

export default function OwnerIssuesPage() {
  const [issues, setIssues] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = () => {
    fetch('http://localhost:4000/api/v1/owner/issues?pageSize=50')
      .then(r => r.json())
      .then(res => {
        if (res.success) setIssues(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    try {
      await fetch(`http://localhost:4000/api/v1/owner/issues/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status })
      });
      load();
    } catch (e) {
      console.error(e);
    }
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Room Issues</h1>
      
      <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 border-b border-slate-200 text-sm font-semibold text-slate-600">
            <tr>
              <th className="p-4">Room</th>
              <th className="p-4">Type</th>
              <th className="p-4">Description</th>
              <th className="p-4">Reporter</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {issues.map(i => (
              <tr key={i.id} className="hover:bg-slate-50">
                <td className="p-4">
                  <div className="font-medium text-slate-800">{i.roomName}</div>
                  {i.equipmentName && <div className="text-sm text-amber-600">{i.equipmentName}</div>}
                </td>
                <td className="p-4 text-sm">{i.issueType.replace('_', ' ')}</td>
                <td className="p-4 text-sm text-slate-600 max-w-md truncate">{i.description || 'No description'}</td>
                <td className="p-4 text-sm">{i.reporterName}</td>
                <td className="p-4">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                    i.status === 'OPEN' ? 'bg-red-100 text-red-700' :
                    i.status === 'ACKNOWLEDGED' ? 'bg-blue-100 text-blue-700' :
                    'bg-green-100 text-green-700'
                  }`}>
                    {i.status}
                  </span>
                </td>
                <td className="p-4 text-right">
                  {i.status === 'OPEN' && (
                    <button onClick={() => updateStatus(i.id, 'ACKNOWLEDGED')} className="text-blue-600 hover:text-blue-800 text-sm font-medium mr-4">Ack</button>
                  )}
                  {i.status !== 'RESOLVED' && (
                    <button onClick={() => updateStatus(i.id, 'RESOLVED')} className="text-green-600 hover:text-green-800 text-sm font-medium">Resolve</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {issues.length === 0 && <div className="p-8 text-center text-slate-500">No issues reported.</div>}
      </div>
    </div>
  );
}
