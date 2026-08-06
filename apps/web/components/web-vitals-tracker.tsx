'use client';

import { useReportWebVitals } from 'next/web-vitals';
import { measurePageLoad } from '@/lib/performance';

export function WebVitalsTracker() {
  useReportWebVitals(measurePageLoad);
  return null;
}
