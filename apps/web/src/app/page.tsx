'use client';
import React from 'react';
import Link from 'next/link';
import { Button } from '@/design-system';

export default function LandingPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-canvas p-8">
      <div className="max-w-2xl text-center space-y-6">
        <div className="w-16 h-16 bg-primary text-white rounded-2xl flex items-center justify-center text-3xl font-bold mx-auto mb-6 shadow-pop">
          M
        </div>
        <h1 className="text-display font-bold text-ink">Meet Without The Maze</h1>
        <p className="text-h2 text-muted">
          Seamlessly list, discover, and book meeting spaces.
        </p>
        <div className="pt-8 flex flex-col sm:flex-row gap-4 justify-center">
          {/* For the demo, direct the owner to the portal */}
          <Link href="/owner/dashboard">
            <Button size="lg" className="w-full sm:w-auto shadow-pop">Go to Owner Portal</Button>
          </Link>
          <Button variant="secondary" size="lg" className="w-full sm:w-auto">Client Portal (Part 3)</Button>
        </div>
      </div>
    </div>
  );
}
