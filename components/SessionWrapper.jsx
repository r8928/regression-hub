'use client';

import { QueryClientProvider } from '@tanstack/react-query';
import { SessionProvider } from 'next-auth/react';
import { getQueryClient } from '@/lib/queryClient';

/** @see {@link __tests__/SessionWrapper.test.jsx} */
export default function SessionWrapper({ children }) {
  const queryClient = getQueryClient();
  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider refetchOnWindowFocus={false} refetchInterval={0}>
        {children}
      </SessionProvider>
    </QueryClientProvider>
  );
}
