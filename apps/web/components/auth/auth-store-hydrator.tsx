'use client';

import { useAuth } from '@/hooks/use-auth';

export function AuthStoreHydrator() {
  useAuth();
  return null;
}
