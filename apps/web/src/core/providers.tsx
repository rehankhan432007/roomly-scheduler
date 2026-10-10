// Providers — QueryClient, Toaster, Auth hydration
'use client';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'sonner';
import { useEffect, useState, type ReactNode } from 'react';
import { useAuth } from './auth/store';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function AuthHydrator({ children }: { children: ReactNode }) {
  const refresh = useAuth((s) => s.refresh);
  const status = useAuth((s) => s.status);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return <>{children}</>;
}

export function Providers({ children }: { children: ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthHydrator>
        {children}
      </AuthHydrator>
      <Toaster
        position="bottom-right"
        richColors
        closeButton
        toastOptions={{
          style: { borderRadius: '10px' },
        }}
      />
    </QueryClientProvider>
  );
}
