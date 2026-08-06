import { useCallback, useEffect } from 'react';
import { apiClient } from '@/lib/api/client';
import { TrackingEvent, TrackingEventName, TrackingEventPayload, buildTrackingPayload } from '@/lib/tracking/events';

export function useTracking() {
  const track = useCallback(async (event: TrackingEventName, overrides?: Partial<TrackingEventPayload>) => {
    try {
      const payload = buildTrackingPayload(event, overrides);
      await apiClient.post('/track', payload, { timeout: 3000 });
    } catch {
      // Silent — tracking never blocks the UI
    }
  }, []);

  return { track };
}

export function usePageTracking(event?: TrackingEventName, properties?: Record<string, unknown>) {
  const { track } = useTracking();

  useEffect(() => {
    track(TrackingEvent.PAGE_VIEW, { properties: { ...properties, page_event: event } });
    if (event) {
      track(event, { properties });
    }
  }, [event, track, JSON.stringify(properties)]);
}
