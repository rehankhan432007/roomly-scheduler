'use client';

import { ErrorState, Logo } from '@/design-system';
import Link from 'next/link';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen bg-canvas flex flex-col items-center justify-center p-4">
      <Link href="/" className="mb-12"><Logo size="lg" /></Link>
      <ErrorState message={error.message || 'An unexpected error occurred'} onRetry={reset} />
    </div>
  );
}
