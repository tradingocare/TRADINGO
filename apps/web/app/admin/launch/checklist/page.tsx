'use client';

import { useEffect, useState, useCallback } from 'react';
import {
  getChecklistItems,
  getChecklistStatuses,
  updateChecklistStatus,
  verifyChecklistItem,
  getChecklistProgress,
  type ChecklistItem,
} from '@/lib/api/launch';
import { DashboardPageHeader, DashboardSkeleton } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { CheckCircle2, Circle, Clock, AlertTriangle, Loader2, Shield } from 'lucide-react';

type ItemStatus = 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'VERIFIED';

const statusConfig: Record<ItemStatus, { icon: typeof CheckCircle2; color: string; label: string }> = {
  NOT_STARTED: { icon: Circle, color: 'text-text-tertiary dark:text-dark-text-tertiary', label: 'Not Started' },
  IN_PROGRESS: { icon: Clock, color: 'text-amber-500', label: 'In Progress' },
  COMPLETED: { icon: CheckCircle2, color: 'text-blue-500', label: 'Completed' },
  VERIFIED: { icon: CheckCircle2, color: 'text-accent-500', label: 'Verified' },
};

const categories = ['Infrastructure', 'Content', 'Legal', 'Marketing', 'Support', 'Technical'];

export default function GoLiveChecklistPage() {
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [statusMap, setStatusMap] = useState<Record<string, { status: ItemStatus; notes: string }>>({});
  const [progress, setProgress] = useState({ notStarted: 0, inProgress: 0, completed: 0, verified: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const [noteInputs, setNoteInputs] = useState<Record<string, string>>({});

  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [fetchedItems, fetchedStatuses, fetchedProgress] = await Promise.all([
        getChecklistItems(),
        getChecklistStatuses(),
        getChecklistProgress(),
      ]);
      setItems(fetchedItems);
      const map: Record<string, { status: ItemStatus; notes: string }> = {};
      for (const s of fetchedStatuses) {
        map[s.itemId] = { status: s.status as ItemStatus, notes: s.notes ?? '' };
      }
      setStatusMap(map);
      setProgress(fetchedProgress);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to load checklist'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const getItemStatus = (item: ChecklistItem): ItemStatus => statusMap[item.id]?.status ?? item.status ?? 'NOT_STARTED';
  const getItemNotes = (item: ChecklistItem): string => statusMap[item.id]?.notes ?? item.notes ?? '';

  const handleStatusUpdate = async (itemId: string, newStatus: ItemStatus) => {
    setSubmittingId(itemId);
    try {
      const notes = noteInputs[itemId] ?? getItemNotes(items.find(i => i.id === itemId)!);
      await updateChecklistStatus(itemId, newStatus, notes);
      await fetchAll();
    } catch {
      // handled by parent
    } finally {
      setSubmittingId(null);
    }
  };

  const handleVerify = async (itemId: string) => {
    setSubmittingId(itemId);
    try {
      const notes = noteInputs[itemId] ?? '';
      await verifyChecklistItem(itemId, notes);
      await fetchAll();
    } catch {
      // handled by parent
    } finally {
      setSubmittingId(null);
    }
  };

  const grouped = categories.map((category) => ({
    category,
    items: items.filter((i) => i.category === category).sort((a, b) => a.sortOrder - b.sortOrder),
  }));

  const verifiedCount = progress.verified;
  const completedCount = progress.completed;
  const verifiedPercent = progress.total > 0 ? Math.round((progress.verified / progress.total) * 100) : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Go-Live Checklist" description="Phase 7E launch readiness verification" />
        <DashboardSkeleton />
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <DashboardPageHeader title="Go-Live Checklist" description="Phase 7E launch readiness verification" />
        <div className="flex flex-col items-center justify-center rounded-xl border border-border bg-surface p-12 dark:bg-dark-surface dark:border-dark-border">
          <AlertTriangle className="h-12 w-12 text-red-500" />
          <p className="mt-4 text-lg font-medium text-text-primary dark:text-dark-text-primary">Failed to load checklist</p>
          <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">{error.message}</p>
          <Button onClick={fetchAll} className="mt-4">Retry</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Go-Live Checklist"
        description={
          `${verifiedCount}/${progress.total} verified · ${completedCount + verifiedCount}/${progress.total} completed`
        }
      />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Verification Progress</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-text-secondary dark:text-dark-text-secondary">{verifiedPercent}% verified</span>
            <span className="text-text-secondary dark:text-dark-text-secondary">
              {progress.verified} / {progress.total} items
            </span>
          </div>
          <div className="h-3 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
            <div
              className="h-full rounded-full bg-accent-500 transition-all duration-500"
              style={{ width: `${verifiedPercent}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {grouped.map(({ category, items: catItems }) =>
        catItems.length === 0 ? null : (
          <Card key={category}>
            <CardHeader>
              <CardTitle>{category}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {catItems.map((item) => {
                const status = getItemStatus(item);
                const config = statusConfig[status];
                const StatusIcon = config.icon;
                const notes = noteInputs[item.id] ?? getItemNotes(item);

                return (
                  <div
                    key={item.id}
                    className="rounded-lg border border-border bg-surface-secondary/50 p-4 dark:border-dark-border dark:bg-dark-surface-secondary/50"
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 min-w-0 flex-1">
                        <StatusIcon className={`mt-0.5 h-5 w-5 shrink-0 ${config.color}`} />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-medium text-text-primary dark:text-dark-text-primary">
                              {item.label}
                            </span>
                            {item.isRequired && (
                              <Badge variant="destructive" className="text-[10px] px-1.5 py-0">
                                Required
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0">
                              {config.label}
                            </Badge>
                          </div>
                          {item.description && (
                            <p className="mt-1 text-sm text-text-secondary dark:text-dark-text-secondary">
                              {item.description}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="shrink-0">
                        {status === 'NOT_STARTED' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submittingId === item.id}
                            onClick={() => handleStatusUpdate(item.id, 'IN_PROGRESS')}
                          >
                            {submittingId === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Mark In Progress
                          </Button>
                        )}
                        {status === 'IN_PROGRESS' && (
                          <Button
                            size="sm"
                            variant="outline"
                            disabled={submittingId === item.id}
                            onClick={() => handleStatusUpdate(item.id, 'COMPLETED')}
                          >
                            {submittingId === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            Mark Complete
                          </Button>
                        )}
                        {status === 'COMPLETED' && (
                          <Button
                            size="sm"
                            variant="default"
                            disabled={submittingId === item.id}
                            onClick={() => handleVerify(item.id)}
                          >
                            {submittingId === item.id ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                            <Shield className="h-3.5 w-3.5 mr-1" />
                            Verify
                          </Button>
                        )}
                        {status === 'VERIFIED' && (
                          <Badge variant="success" className="gap-1">
                            <CheckCircle2 className="h-3.5 w-3.5" />
                            Verified
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="mt-3">
                      <Textarea
                        placeholder="Add notes..."
                        className="min-h-[60px] text-sm"
                        value={notes}
                        onChange={(e) =>
                          setNoteInputs((prev) => ({ ...prev, [item.id]: e.target.value }))
                        }
                        onBlur={async () => {
                          if (notes !== getItemNotes(item)) {
                            await updateChecklistStatus(item.id, status, notes).catch(() => {});
                          }
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        ),
      )}
    </div>
  );
}
