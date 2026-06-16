'use client';

import { useState, useRef, useCallback } from 'react';
import { Upload, X, FileText, Video, Image as ImageIcon, File as FileIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FileUploadZoneProps {
  accept?: string;
  multiple?: boolean;
  maxFiles?: number;
  maxSize?: number;
  files: File[];
  onFilesChange: (files: File[]) => void;
  type: 'media' | 'attachment' | 'certification';
}

interface FileWithPreview {
  file: File;
  preview?: string;
  progress?: number;
}

const typeLabels: Record<string, string> = {
  media: 'Images, Videos & PDFs',
  attachment: 'Documents & Attachments',
  certification: 'Certification Documents',
};

const typeAccepts: Record<string, string> = {
  media: 'image/*,video/*,application/pdf',
  attachment: '.pdf,.doc,.docx,.xls,.xlsx,.txt',
  certification: '.pdf,.jpg,.jpeg,.png',
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(file: File) {
  const type = file.type;
  if (type.startsWith('image/')) return ImageIcon;
  if (type.startsWith('video/')) return Video;
  if (type === 'application/pdf') return FileText;
  return FileIcon;
}

export function FileUploadZone({
  accept,
  multiple = true,
  maxFiles = 10,
  maxSize = 10,
  files,
  onFilesChange,
  type,
}: FileUploadZoneProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [items, setItems] = useState<FileWithPreview[]>(() =>
    files.map((f) => ({ file: f })),
  );

  const updateFiles = useCallback(
    (newItems: FileWithPreview[]) => {
      setItems(newItems);
      onFilesChange(newItems.map((i) => i.file));
    },
    [onFilesChange],
  );

  const handleFileSelect = useCallback(
    (newFiles: FileList | File[]) => {
      const incoming = Array.from(newFiles);
      const remaining = maxFiles - items.length;
      if (remaining <= 0) return;

      const toAdd = incoming.slice(0, remaining);
      const validFiles: FileWithPreview[] = [];

      for (const file of toAdd) {
        if (file.size > maxSize * 1024 * 1024) continue;
        const item: FileWithPreview = { file, progress: 0 };
        if (file.type.startsWith('image/')) {
          item.preview = URL.createObjectURL(file);
        }
        validFiles.push(item);
      }

      const newItems = [...items, ...validFiles];
      updateFiles(newItems);
    },
    [items, maxFiles, maxSize, updateFiles],
  );

  const removeFile = useCallback(
    (index: number) => {
      const item = items[index];
      if (item.preview) URL.revokeObjectURL(item.preview);
      const newItems = items.filter((_, i) => i !== index);
      updateFiles(newItems);
    },
    [items, updateFiles],
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      handleFileSelect(e.dataTransfer.files);
    }
  };

  const acceptedMime = accept || typeAccepts[type] || '*/*';
  const label = typeLabels[type] || 'Files';

  return (
    <div className="space-y-4">
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          'flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed p-8 text-center transition-all',
          dragOver
            ? 'border-primary-500 bg-primary-500/5 dark:border-primary-400 dark:bg-primary-500/10'
            : 'border-border bg-surface hover:border-primary-400 hover:bg-primary-500/5 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-500',
        )}
      >
        <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary-500/10 dark:bg-primary-500/20">
          <Upload className="h-6 w-6 text-primary-600 dark:text-primary-400" />
        </div>
        <p className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
          Drop your {label} here
        </p>
        <p className="mt-1 text-xs text-text-tertiary">
          or click to browse &middot; Max {maxFiles} files &middot; Up to {maxSize} MB each
        </p>
        <input
          ref={inputRef}
          type="file"
          accept={acceptedMime}
          multiple={multiple}
          className="hidden"
          onChange={(e) => {
            if (e.target.files) {
              handleFileSelect(e.target.files);
              e.target.value = '';
            }
          }}
        />
      </div>

      {items.length > 0 && (
        <div className="space-y-2">
          <p className="text-xs font-medium text-text-secondary dark:text-dark-text-secondary">
            {items.length} file{items.length !== 1 ? 's' : ''} selected
          </p>
          <div className="grid gap-2 sm:grid-cols-2">
            {items.map((item, index) => {
              const Icon = getFileIcon(item.file);
              return (
                <div
                  key={`${item.file.name}-${index}`}
                  className="group relative flex items-center gap-3 rounded-lg border border-border bg-surface p-3 dark:border-dark-border dark:bg-dark-surface"
                >
                  {item.preview ? (
                    <img
                      src={item.preview}
                      alt={item.file.name}
                      className="h-12 w-12 shrink-0 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-md bg-surface-secondary dark:bg-dark-surface-secondary">
                      <Icon className="h-6 w-6 text-text-tertiary" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      {item.file.name}
                    </p>
                    <p className="text-xs text-text-tertiary">{formatSize(item.file.size)}</p>
                    {item.progress !== undefined && (
                      <div className="mt-1 h-1 w-full overflow-hidden rounded-full bg-surface-tertiary dark:bg-dark-surface-tertiary">
                        <div
                          className="h-full rounded-full bg-primary-500 transition-all"
                          style={{ width: `${item.progress}%` }}
                        />
                      </div>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFile(index);
                    }}
                    className="shrink-0 rounded-full p-1 text-text-tertiary opacity-0 transition-opacity hover:bg-red-50 hover:text-red-600 group-hover:opacity-100 dark:hover:bg-red-900/20"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
