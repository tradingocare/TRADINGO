'use client';

import { useState, useRef, type DragEvent, type ChangeEvent } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Upload, FileText, X, Loader2 } from 'lucide-react';

interface FileUploadInputProps {
  onUpload: (file: File) => void;
  uploading?: boolean;
}

export function FileUploadInput({ onUpload, uploading }: FileUploadInputProps) {
  const [dragOver, setDragOver] = useState(false);
  const [preview, setPreview] = useState<{ file: File; url?: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(true);
  };

  const handleDragLeave = () => setDragOver(false);

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) processFile(file);
  };

  const handleChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) processFile(file);
  };

  const processFile = (file: File) => {
    if (file.type.startsWith('image/')) {
      setPreview({ file, url: URL.createObjectURL(file) });
    } else {
      setPreview({ file });
    }
  };

  const handleUpload = () => {
    if (preview) {
      onUpload(preview.file);
      setPreview(null);
    }
  };

  const handleClear = () => {
    if (preview?.url) URL.revokeObjectURL(preview.url);
    setPreview(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="space-y-2">
      {preview ? (
        <div className="flex items-center gap-3 rounded-lg border border-border bg-surface-secondary/50 p-3 dark:border-dark-border dark:bg-dark-surface-secondary/50">
          {preview.url ? (
            <img src={preview.url} alt="Preview" className="h-12 w-12 rounded object-cover" />
          ) : (
            <div className="flex h-12 w-12 items-center justify-center rounded bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
              <FileText className="h-5 w-5" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-medium text-text-primary dark:text-dark-text-primary">
              {preview.file.name}
            </p>
            <p className="text-xs text-text-secondary dark:text-dark-text-secondary">
              {formatSize(preview.file.size)}
            </p>
          </div>
          {uploading ? (
            <Loader2 className="h-5 w-5 animate-spin text-primary-600" />
          ) : (
            <div className="flex items-center gap-1">
              <Button size="sm" onClick={handleUpload}>Send</Button>
              <Button size="sm" variant="ghost" onClick={handleClear}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      ) : (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={cn(
            'flex cursor-pointer flex-col items-center justify-center rounded-lg border-2 border-dashed p-4 transition-colors',
            dragOver
              ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
              : 'border-border bg-surface hover:border-primary-400 dark:border-dark-border dark:bg-dark-surface dark:hover:border-primary-500',
          )}
        >
          <Upload className={cn('h-6 w-6', dragOver ? 'text-primary-600' : 'text-text-tertiary')} />
          <p className="mt-1 text-xs text-text-secondary dark:text-dark-text-secondary">
            Drop a file here or click to browse
          </p>
          <p className="text-[10px] text-text-tertiary">Images, PDFs, Documents, Voice Notes</p>
        </div>
      )}
      <input
        ref={inputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.mp3,.wav,.ogg,.m4a"
        className="hidden"
        onChange={handleChange}
      />
    </div>
  );
}
