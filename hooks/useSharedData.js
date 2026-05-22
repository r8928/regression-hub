'use client';

import { listModules } from '@/lib/api/modules';
import { getSettings } from '@/lib/api/settings';
import { useQuery } from '@tanstack/react-query';

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => getSettings(),
    staleTime: 30_000,
  });
}

export function useModules(applicationId) {
  return useQuery({
    queryKey: ['modules', applicationId ?? 'all'],
    queryFn: () => listModules(applicationId ? { applicationId } : {}),
    staleTime: 5 * 60_000,
  });
}

export function useQaUsers() {
  const { data } = useSettings();
  return data?.qaUsers ?? [];
}
