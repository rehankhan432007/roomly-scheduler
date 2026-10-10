'use client';

import { useAuth } from '@/core/auth/store';
import { PortalShell } from '@/core/PortalShell';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect } from 'react';
import { ErrorState, Spinner } from '@/design-system';

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const { user, status } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.replace(`/login?next=${encodeURIComponent(pathname)}`);
    }
  }, [status, router, pathname]);

  if (status === 'loading') {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas">
        <Spinner size="lg" />
      </div>
    );
  }

  if (status === 'unauthenticated') return null;

  if (user?.role !== 'CLIENT') {
    return (
      <div className="flex h-screen items-center justify-center bg-canvas p-4">
        <ErrorState
          message="Forbidden. You are logged in as an Owner."
          onRetry={() => router.replace('/owner/dashboard')}
        />
      </div>
    );
  }

  return <PortalShell role="CLIENT">{children}</PortalShell>;
}
