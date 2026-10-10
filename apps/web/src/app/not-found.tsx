'use client';

import { EmptyState, Button, Logo } from '@/design-system';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-12"><Logo size="lg" /></Link>
      
      <div className="max-w-md w-full bg-surface rounded-card p-8 border border-line text-center shadow-card">
        <h1 className="text-display font-bold text-ink mb-2">404</h1>
        <h2 className="text-h2 font-semibold text-ink mb-2">Page not found</h2>
        <p className="text-body text-muted mb-8">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <Link href="/">
          <Button fullWidth>Go to Homepage</Button>
        </Link>
      </div>
    </div>
  );
}
