'use client';

import { useState } from 'react';
import { Plus, X, ShieldCheck, Pencil, FileUp } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { ProductDraftCertification } from '@/lib/product-onboarding/types';
import { CERTIFICATION_TYPES } from '@/data/master-data';

interface CertificationEditorProps {
  certifications: ProductDraftCertification[];
  onChange: (certifications: ProductDraftCertification[]) => void;
}

const CERT_TYPES = CERTIFICATION_TYPES;

export function CertificationEditor({ certifications, onChange }: CertificationEditorProps) {
  const [showTypeSelector, setShowTypeSelector] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const addCertification = (type: string) => {
    setShowTypeSelector(false);
    const newCert: ProductDraftCertification = {
      id: `temp-${Date.now()}`,
      draftId: '',
      type,
      number: '',
      issuedBy: '',
      issuedAt: '',
      expiresAt: '',
      fileUrl: '',
      verified: false,
    };
    const updated = [...certifications, newCert];
    onChange(updated);
    setEditingId(newCert.id);
  };

  const removeCertification = (id: string) => {
    onChange(certifications.filter((c) => c.id !== id));
    if (editingId === id) setEditingId(null);
  };

  const updateCert = (id: string, field: keyof ProductDraftCertification, value: any) => {
    onChange(
      certifications.map((c) => (c.id === id ? { ...c, [field]: value } : c)),
    );
  };

  const getTypeLabel = (type: string) =>
    CERT_TYPES.find((t) => t.value === type)?.label || type;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="space-y-0.5">
          <Label>Certifications</Label>
          <p className="text-xs text-text-tertiary">
            Add relevant product certifications to build buyer trust.
          </p>
        </div>
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowTypeSelector(!showTypeSelector)}
          >
            <Plus className="mr-1 h-4 w-4" />
            Add Certification
          </Button>
          {showTypeSelector && (
            <div className="absolute right-0 top-full z-10 mt-1 w-56 rounded-lg border border-border bg-surface p-1 shadow-lg dark:border-dark-border dark:bg-dark-surface">
              {CERT_TYPES.map((cert) => (
                <button
                  key={cert.value}
                  type="button"
                  onClick={() => addCertification(cert.value)}
                  className="w-full rounded-md px-3 py-1.5 text-left text-sm text-text-primary hover:bg-surface-secondary dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary"
                >
                  {cert.label}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {certifications.length === 0 && (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-border bg-surface-secondary p-10 text-center dark:border-dark-border dark:bg-dark-surface-secondary">
          <ShieldCheck className="mb-2 h-8 w-8 text-text-tertiary" />
          <p className="text-sm text-text-tertiary">
            No certifications added. Add certifications to increase buyer confidence.
          </p>
        </div>
      )}

      <div className="space-y-3">
        {certifications.map((cert) => {
          const isEditing = editingId === cert.id;
          return (
            <div
              key={cert.id}
              className={cn(
                'rounded-xl border transition-all',
                isEditing
                  ? 'border-primary-300 bg-primary-500/5 dark:border-primary-700 dark:bg-primary-500/10'
                  : 'border-border bg-surface dark:border-dark-border dark:bg-dark-surface',
              )}
            >
              {isEditing ? (
                <div className="p-5 space-y-4">
                  <div className="flex items-center justify-between">
                    <Badge variant="default" className="text-xs">
                      {getTypeLabel(cert.type)}
                    </Badge>
                    <button
                      type="button"
                      onClick={() => setEditingId(null)}
                      className="rounded-md p-1 text-text-tertiary hover:bg-surface-secondary dark:hover:bg-dark-surface-secondary"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="space-y-1.5">
                      <Label htmlFor={`cert-number-${cert.id}`}>Certification Number</Label>
                      <Input
                        id={`cert-number-${cert.id}`}
                        value={cert.number || ''}
                        onChange={(e) => updateCert(cert.id, 'number', e.target.value)}
                        placeholder="e.g. ISO-2024-12345"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`cert-issued-by-${cert.id}`}>Issued By</Label>
                      <Input
                        id={`cert-issued-by-${cert.id}`}
                        value={cert.issuedBy || ''}
                        onChange={(e) => updateCert(cert.id, 'issuedBy', e.target.value)}
                        placeholder="e.g. Bureau of Indian Standards"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`cert-issued-${cert.id}`}>Issue Date</Label>
                      <Input
                        id={`cert-issued-${cert.id}`}
                        type="date"
                        value={cert.issuedAt?.split('T')[0] || ''}
                        onChange={(e) => updateCert(cert.id, 'issuedAt', e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor={`cert-expiry-${cert.id}`}>Expiry Date</Label>
                      <Input
                        id={`cert-expiry-${cert.id}`}
                        type="date"
                        value={cert.expiresAt?.split('T')[0] || ''}
                        onChange={(e) => updateCert(cert.id, 'expiresAt', e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Upload Certificate</Label>
                    <div className="flex cursor-pointer items-center gap-3 rounded-lg border border-dashed border-border bg-surface-secondary p-4 text-center transition-colors hover:border-primary-400 hover:bg-primary-500/5 dark:border-dark-border dark:bg-dark-surface-secondary dark:hover:border-primary-500">
                      <FileUp className="h-5 w-5 text-text-tertiary" />
                      <span className="text-sm text-text-tertiary">
                        {cert.fileUrl ? 'Replace file' : 'Click to upload certificate (PDF, JPG, PNG)'}
                      </span>
                    </div>
                    {cert.fileUrl && (
                      <p className="text-xs text-accent-600 dark:text-accent-400">
                        File: {cert.fileUrl}
                      </p>
                    )}
                  </div>
                </div>
              ) : (
                <div className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-accent-500/10 text-accent-600 dark:bg-accent-500/20 dark:text-accent-400">
                      <ShieldCheck className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-text-primary dark:text-dark-text-primary">
                          {getTypeLabel(cert.type)}
                        </span>
                        {cert.verified && (
                          <Badge variant="success" className="text-[10px]">Verified</Badge>
                        )}
                      </div>
                      {cert.number && (
                        <p className="text-xs text-text-tertiary">{cert.number}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      onClick={() => setEditingId(cert.id)}
                      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-surface-secondary hover:text-text-primary dark:hover:bg-dark-surface-secondary"
                    >
                      <Pencil className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeCertification(cert.id)}
                      className="rounded-md p-1.5 text-text-tertiary transition-colors hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
