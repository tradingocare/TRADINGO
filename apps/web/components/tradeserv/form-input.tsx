import type { ElementType } from 'react';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';

export function FormInput({ label, value, onChange, icon: Icon, placeholder, type = 'text', textarea = false, rows = 3 }: {
  label: string; value: string; onChange: (v: string) => void; icon?: ElementType;
  placeholder?: string; type?: string; textarea?: boolean; rows?: number;
}) {
  return (
    <div>
      <label className="mb-1.5 flex items-center gap-1.5 text-xs text-text-secondary">
        {Icon && <Icon className="h-3.5 w-3.5" />}{label}
      </label>
      {textarea ? (
        <Textarea value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          rows={rows} className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-[#f59e0b]/40 resize-none" />
      ) : (
        <Input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className="w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-text-primary placeholder:text-text-tertiary outline-none transition-all focus:border-[#f59e0b]/40" />
      )}
    </div>
  );
}
