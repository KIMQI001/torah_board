'use client';

import { useAuth as useAuthBase } from '@/contexts/AuthContext';

export function useAuth() {
  const authContext = useAuthBase();

  return {
    ...authContext,
  };
}