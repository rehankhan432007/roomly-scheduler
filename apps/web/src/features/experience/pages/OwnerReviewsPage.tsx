'use client';

import React, { useState, useEffect } from 'react';
// import { api } from '@/core/api/client';

export default function OwnerReviewsPage() {
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('http://localhost:4000/api/v1/owner/reviews?pageSize=50')
      .then(r => r.json())
      .then(res => {
        if (res.success) setReviews(res.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Room Reviews</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {reviews.map(r => (
          <div key={r.id} className="bg-white rounded-xl shadow-sm border border-slate-200 p-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="font-semibold text-slate-800">{r.roomName}</h3>
                <p className="text-sm text-slate-500">{new Date(r.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="flex items-center gap-1 bg-amber-50 text-amber-700 px-2 py-1 rounded-lg font-bold">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                {r.rating}/10
              </div>
            </div>
            
            {r.comment && (
              <p className="text-slate-700 italic mb-4">"{r.comment}"</p>
            )}
            
            {r.tags && r.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4">
                {r.tags.map((t: string) => (
                  <span key={t} className="px-2 py-1 bg-slate-100 text-slate-600 rounded text-xs">
                    {t.replace('_', ' ')}
                  </span>
                ))}
              </div>
            )}
            
            <div className="text-sm text-slate-500 pt-4 border-t border-slate-100">
              By {r.reviewerName}
            </div>
          </div>
        ))}
      </div>
      
      {reviews.length === 0 && <div className="p-8 text-center text-slate-500">No reviews yet.</div>}
    </div>
  );
}
