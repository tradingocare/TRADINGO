import { useEffect, useSyncExternalStore, type RefObject } from 'react';

/**
 * Phase 3G: bounded concurrency for SUBCATEGORY PREVIEW requests only.
 *
 * At most PREVIEW_MAX_ACTIVE preview tickets hold a slot at any time.
 * The scheduler controls WHEN a preview query becomes eligible (via the
 * existing `enabled` flag); React Query keeps doing the actual request,
 * caching, deduplication, retry policy, and result handling.
 *
 * Priority is one-shot at registration: PRIORITY_VISIBLE (in the viewport
 * right now) before PRIORITY_NEAR_VISIBLE (inside the card's root margin).
 * FIFO within a tier; the page is finite so every ticket drains (no
 * starvation). Slots release on settle or unmount — never held past use.
 */
export const PREVIEW_MAX_ACTIVE = 3;
export const PRIORITY_VISIBLE = 0;
export const PRIORITY_NEAR_VISIBLE = 1;

interface Ticket {
  key: string;
  priority: number;
  seq: number;
}

class PreviewScheduler {
  private active = new Set<string>();
  private queue: Ticket[] = [];
  private listeners = new Set<() => void>();
  private seq = 0;

  subscribe = (fn: () => void): (() => void) => {
    this.listeners.add(fn);
    return () => {
      this.listeners.delete(fn);
    };
  };

  private emit(): void {
    this.listeners.forEach((fn) => fn());
  }

  isGranted(key: string): boolean {
    return this.active.has(key);
  }

  /** Current slot occupancy (tests/telemetry). Never exceeds PREVIEW_MAX_ACTIVE. */
  activeCount(): number {
    return this.active.size;
  }

  queuedCount(): number {
    return this.queue.length;
  }

  register(key: string, priority: number): void {
    if (this.active.has(key)) return;
    const qi = this.queue.findIndex((t) => t.key === key);
    if (qi >= 0) {
      if (priority < this.queue[qi].priority) this.queue[qi].priority = priority;
      this.sortQueue();
      return;
    }
    if (this.active.size < PREVIEW_MAX_ACTIVE) {
      this.active.add(key);
      this.emit();
      return;
    }
    const ticket: Ticket = { key, priority, seq: this.seq++ };
    this.queue.push(ticket);
    this.sortQueue();
  }

  release(key: string): void {
    let granted = false;
    if (this.active.delete(key)) {
      while (this.active.size < PREVIEW_MAX_ACTIVE && this.queue.length > 0) {
        const next = this.queue.shift();
        if (!next) break;
        this.active.add(next.key);
        granted = true;
      }
    } else {
      const qi = this.queue.findIndex((t) => t.key === key);
      if (qi >= 0) this.queue.splice(qi, 1);
    }
    if (granted) this.emit();
  }

  private sortQueue(): void {
    this.queue.sort((a, b) => a.priority - b.priority || a.seq - b.seq);
  }

  /** Test-only reset. */
  __reset(): void {
    this.active.clear();
    this.queue = [];
    this.seq = 0;
  }
}

export const previewScheduler = new PreviewScheduler();

const subscribeToScheduler = previewScheduler.subscribe;

/**
 * Returns true once this ticket holds a slot. Registers while `eligible`,
 * releases on settle (caller) or unmount (cleanup). Priority is sampled
 * once at registration from the element's current viewport position.
 */
export function usePreviewSlot(
  key: string | null,
  eligible: boolean,
  elementRef?: RefObject<HTMLElement | null>,
): boolean {
  const granted = useSyncExternalStore(
    subscribeToScheduler,
    () => (key ? previewScheduler.isGranted(key) : false),
    () => (key ? previewScheduler.isGranted(key) : false),
  );

  useEffect(() => {
    if (!eligible || !key) return;
    let priority = PRIORITY_NEAR_VISIBLE;
    const el = elementRef?.current;
    if (el && typeof window !== 'undefined') {
      const box = el.getBoundingClientRect();
      if (box.bottom > 0 && box.top < window.innerHeight) priority = PRIORITY_VISIBLE;
    }
    previewScheduler.register(key, priority);
    return () => {
      previewScheduler.release(key);
    };
  }, [eligible, key, elementRef]);

  return eligible && granted;
}
