'use client';

import { useState } from 'react';
import { Copy, Check, ExternalLink, Eye } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { ProductAttributeField } from '@/types/product-detail';

interface AttributeValueProps {
  field: ProductAttributeField;
  className?: string;
}

export function AttributeValue({ field, className }: AttributeValueProps) {
  const { type, displayValue, unit } = field;

  if (displayValue === null || displayValue === undefined || displayValue === '') {
    return <span className="text-text-tertiary italic text-sm">Not specified</span>;
  }

  switch (type) {
    case 'TEXT':
    case 'TEXTAREA':
      return <TextValue value={displayValue} className={className} />;

    case 'RICH_TEXT':
      return <RichTextValue value={displayValue} className={className} />;

    case 'NUMBER':
      return (
        <span className={cn('font-medium', className)}>
          {Number(displayValue).toLocaleString()}{unit ? <span className="ml-1 text-text-tertiary text-sm">{unit}</span> : null}
        </span>
      );

    case 'PRICE':
      return (
        <span className={cn('font-medium', className)}>
          ₹{Number(displayValue).toLocaleString('en-IN')}{unit ? <span className="ml-1 text-text-tertiary text-sm">/{unit}</span> : null}
        </span>
      );

    case 'SELECT':
    case 'RADIO':
      return <span className={cn('font-medium', className)}>{displayValue}</span>;

    case 'MULTI_SELECT':
    case 'TAGS': {
      const items = Array.isArray(displayValue) ? displayValue : [displayValue];
      return (
        <div className={cn('flex flex-wrap gap-1.5', className)}>
          {items.map((item: string, i: number) => (
            <span key={i} className="inline-flex items-center rounded-full bg-primary-50 px-2.5 py-0.5 text-xs font-medium text-primary-700 dark:bg-primary-900/30 dark:text-primary-400">
              {item}
            </span>
          ))}
        </div>
      );
    }

    case 'CHECKBOX':
      return displayValue === true
        ? <span className="text-green-600 dark:text-green-400 font-medium">Yes</span>
        : <span className="text-text-tertiary">No</span>;

    case 'DATE':
      return <span className={cn('font-medium', className)}>{displayValue}</span>;

    case 'URL':
      return <UrlValue value={displayValue} className={className} />;

    case 'PHONE':
      return (
        <a href={`tel:${displayValue}`} className={cn('text-primary-600 hover:underline dark:text-primary-400', className)}>
          {displayValue}
        </a>
      );

    case 'FILE':
    case 'PDF':
      return <FileValue value={displayValue} label={field.label} />;

    case 'IMAGE':
      return <ImageValue value={displayValue} label={field.label} />;

    case 'VIDEO':
      return <VideoValue value={displayValue} />;

    case 'LOCATION':
      return <LocationValue value={displayValue} />;

    case 'JSON':
      return <JsonValue value={displayValue} />;

    default:
      return <span className={className}>{String(displayValue)}</span>;
  }
}

function TextValue({ value, className }: { value: string; className?: string }) {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(value).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); });
  };
  return (
    <span className={cn('group inline-flex items-center gap-1.5', className)}>
      <span className="break-words">{value}</span>
      <button onClick={handleCopy} className="opacity-0 group-hover:opacity-100 transition-opacity text-text-tertiary hover:text-text-primary" title="Copy">
        {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </span>
  );
}

function RichTextValue({ value, className }: { value: string; className?: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = value.length > 200;
  return (
    <div className={className}>
      <div className={cn('text-sm leading-relaxed whitespace-pre-wrap', !expanded && isLong && 'line-clamp-3')}>
        {value}
      </div>
      {isLong && (
        <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs text-primary-600 hover:underline dark:text-primary-400">
          {expanded ? 'Show less' : 'Show more'}
        </button>
      )}
    </div>
  );
}

function UrlValue({ value, className }: { value: string; className?: string }) {
  const href = value.startsWith('http') ? value : `https://${value}`;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn('inline-flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400 break-all', className)}
    >
      {value}
      <ExternalLink className="h-3 w-3 flex-shrink-0" />
    </a>
  );
}

function FileValue({ value, label }: { value: any; label: string }) {
  const url = typeof value === 'string' ? value : value?.url || '';
  const name = value?.name || label;
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 rounded-lg border border-border bg-surface-secondary px-3 py-2 text-sm hover:bg-surface dark:border-dark-border dark:bg-dark-surface-secondary dark:hover:bg-dark-surface"
    >
      <Eye className="h-4 w-4 text-primary-600" />
      <span className="text-text-primary dark:text-dark-text-primary">{name}</span>
    </a>
  );
}

function ImageValue({ value, label }: { value: any; label: string }) {
  const url = typeof value === 'string' ? value : value?.url || '';
  const [preview, setPreview] = useState(false);
  return (
    <>
      <button onClick={() => setPreview(true)} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-border dark:border-dark-border">
        <img src={url} alt={label} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
      </button>
      {preview && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60" onClick={() => setPreview(false)}>
          <img src={url} alt={label} className="max-h-[80vh] max-w-[80vw] rounded-xl object-contain shadow-2xl" />
        </div>
      )}
    </>
  );
}

function VideoValue({ value }: { value: any }) {
  const url = typeof value === 'string' ? value : value?.url || '';
  return (
    <video controls className="max-w-full rounded-lg border border-border dark:border-dark-border" style={{ maxHeight: 240 }}>
      <source src={url} />
    </video>
  );
}

function LocationValue({ value }: { value: any }) {
  const lat = value?.lat || 0;
  const lng = value?.lng || 0;
  const address = value?.address || '';
  const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`;
  return (
    <div className="text-sm">
      {address && <p className="text-text-primary dark:text-dark-text-primary">{address}</p>}
      <a href={mapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary-600 hover:underline dark:text-primary-400 text-xs mt-0.5">
        {lat.toFixed(4)}, {lng.toFixed(4)} <ExternalLink className="h-3 w-3" />
      </a>
    </div>
  );
}

function JsonValue({ value }: { value: any }) {
  const str = typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value);
  const [expanded, setExpanded] = useState(false);
  return (
    <div>
      <pre className={cn('bg-surface-secondary dark:bg-dark-surface-secondary rounded-lg p-3 text-xs overflow-x-auto', !expanded && 'max-h-20')}>
        {str}
      </pre>
      {str.length > 100 && (
        <button onClick={() => setExpanded(!expanded)} className="mt-1 text-xs text-primary-600 hover:underline dark:text-primary-400">
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      )}
    </div>
  );
}
