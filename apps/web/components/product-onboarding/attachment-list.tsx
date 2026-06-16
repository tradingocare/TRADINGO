'use client';

import { useState } from 'react';
import { FileText, Image, FileSpreadsheet, File, GripVertical, X, Filter } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductDraftAttachment } from '@/lib/product-onboarding/types';

interface AttachmentListProps {
  attachments: ProductDraftAttachment[];
  onChange: (attachments: ProductDraftAttachment[]) => void;
  types: string[];
}

function getAttachmentIcon(type: string) {
  const lower = type.toLowerCase();
  if (lower.includes('image') || lower.includes('jpg') || lower.includes('png') || lower.includes('jpeg')) return Image;
  if (lower.includes('spreadsheet') || lower.includes('excel') || lower.includes('xls') || lower.includes('csv')) return FileSpreadsheet;
  if (lower.includes('pdf') || lower.includes('doc') || lower.includes('text')) return FileText;
  return File;
}

function formatFileSize(bytes?: number): string {
  if (!bytes) return '—';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentList({ attachments, onChange, types }: AttachmentListProps) {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const filtered = activeFilter
    ? attachments.filter((a) => a.type === activeFilter)
    : attachments;

  const removeAttachment = (id: string) => {
    onChange(attachments.filter((a) => a.id !== id));
  };

  const handleDragStart = (index: number) => {
    setDragIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    const reordered = [...attachments];
    const [moved] = reordered.splice(dragIndex, 1);
    reordered.splice(index, 0, moved);
    onChange(
      reordered.map((a, i) => ({ ...a, sortOrder: i })),
    );
    setDragIndex(index);
  };

  const handleDragEnd = () => {
    setDragIndex(null);
  };

  const uniqueTypes = Array.from(new Set([...types, ...attachments.map((a) => a.type)]));

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <Filter className="h-4 w-4 text-text-tertiary" />
        {uniqueTypes.map((type) => (
          <button
            key={type}
            type="button"
            onClick={() => setActiveFilter(activeFilter === type ? null : type)}
            className={cn(
              'rounded-lg px-3 py-1 text-xs font-medium transition-colors',
              activeFilter === type
                ? 'bg-primary-500/10 text-primary-600 dark:bg-primary-500/20 dark:text-primary-400'
                : 'bg-surface-secondary text-text-secondary hover:bg-surface-tertiary dark:bg-dark-surface-secondary dark:text-dark-text-secondary dark:hover:bg-dark-surface-tertiary',
            )}
          >
            {type}
          </button>
        ))}
        {activeFilter && (
          <button
            type="button"
            onClick={() => setActiveFilter(null)}
            className="ml-1 text-xs text-text-tertiary hover:text-text-primary"
          >
            Clear
          </button>
        )}
      </div>

      {filtered.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary p-10 text-center dark:border-dark-border dark:bg-dark-surface-secondary">
          <File className="mb-2 h-8 w-8 text-text-tertiary" />
          <p className="text-sm text-text-tertiary">
            {activeFilter
              ? `No attachments of type "${activeFilter}".`
              : 'No attachments uploaded yet.'}
          </p>
        </div>
      )}

      <div className="space-y-1">
        {filtered.map((attachment, _displayIndex) => {
          const actualIndex = attachments.indexOf(attachment);
          const Icon = getAttachmentIcon(attachment.type);
          return (
            <div
              key={attachment.id}
              draggable
              onDragStart={() => handleDragStart(actualIndex)}
              onDragOver={(e) => handleDragOver(e, actualIndex)}
              onDragEnd={handleDragEnd}
              className={cn(
                'flex items-center gap-3 rounded-lg border border-border bg-surface px-4 py-3 transition-all dark:border-dark-border dark:bg-dark-surface',
                dragIndex === actualIndex && 'opacity-50 shadow-md',
                'hover:border-primary-300 dark:hover:border-primary-600',
              )}
            >
              <div className="cursor-grab text-text-tertiary hover:text-text-secondary">
                <GripVertical className="h-4 w-4" />
              </div>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-secondary text-text-secondary dark:bg-dark-surface-secondary dark:text-dark-text-secondary">
                <Icon className="h-5 w-5" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-text-primary dark:text-dark-text-primary">
                  {attachment.title || attachment.url.split('/').pop() || 'Untitled'}
                </p>
                <div className="flex items-center gap-3 text-xs text-text-tertiary">
                  <span>{formatFileSize(attachment.fileSize)}</span>
                  <span className="rounded bg-surface-secondary px-1.5 py-0.5 dark:bg-dark-surface-secondary">
                    {attachment.type}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeAttachment(attachment.id)}
                className="shrink-0 rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>

      {attachments.length > 0 && (
        <p className="text-xs text-text-tertiary">
          Drag to reorder &middot; {attachments.length} attachment{attachments.length !== 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
