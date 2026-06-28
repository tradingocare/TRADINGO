'use client';

import { useRef } from 'react';
import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, Image, Trash2, File } from 'lucide-react';

const attachmentTypes = [
  { type: 'IMAGE' as const, label: 'Image', icon: Image },
  { type: 'PDF' as const, label: 'PDF', icon: FileText },
  { type: 'DOCUMENT' as const, label: 'Document', icon: File },
];

export function StepAttachments() {
  const { attachments, addAttachment, removeAttachment } = useRfqWizardStore();
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (type: 'IMAGE' | 'PDF' | 'DOCUMENT') => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = type === 'IMAGE' ? 'image/*' : type === 'PDF' ? 'application/pdf' : '.doc,.docx,.xls,.xlsx';
    input.onchange = (e: any) => {
      const file = e.target?.files?.[0];
      if (file) {
        addAttachment({ file, name: file.name, type });
      }
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Attachments</h2>

      <div className="flex flex-wrap gap-3">
        {attachmentTypes.map(({ type, label, icon: Icon }) => (
          <Button key={type} variant="outline" onClick={() => handleFileUpload(type)}>
            <Icon className="mr-2 h-4 w-4" />
            Add {label}
          </Button>
        ))}
      </div>

      {attachments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-white/[0.06] p-8 text-center">
          <Upload className="h-8 w-8 text-white/30" />
          <p className="mt-2 text-sm text-white/60">No attachments yet</p>
          <p className="text-xs text-white/40">Upload specification sheets, drawings, or catalogues</p>
        </div>
      ) : (
        <div className="space-y-2">
          {attachments.map((a, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg border border-white/[0.06] bg-white/[0.04] p-3">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-orange-500/10 text-orange-400">
                {a.type === 'IMAGE' ? <Image className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-white truncate">{a.name}</p>
                <p className="text-xs text-white/40">{a.type}</p>
              </div>
              <Badge variant="secondary">{a.type}</Badge>
              <button onClick={() => removeAttachment(i)} className="text-red-400 hover:text-red-300">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
