'use client';

import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/dashboard';
import { FileText, Package, Store, MapPin, AlertTriangle } from 'lucide-react';

export function StepPreview() {
  const { title, description, priority, visibility, expiryDays, products, suppliers, location, requiredDate, paymentPreference, terms, attachments, rfqType } = useRfqWizardStore();

  const selectedSuppliers = suppliers.filter((s) => s.selected);
  const warnings: string[] = [];
  if (!title) warnings.push('RFQ has no title');
  if (products.length === 0) warnings.push('No products added');
  if (selectedSuppliers.length === 0) warnings.push('No suppliers selected — RFQ will be open to all');

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Preview</h2>

      {warnings.length > 0 && (
        <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
          <div className="flex items-center gap-2 text-amber-400">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">Review suggestions</span>
          </div>
          <ul className="mt-1 list-inside list-disc text-xs text-amber-400/80">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <FileText className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Requirement</span>
            </div>
            <h3 className="text-lg font-semibold text-white">{title || 'Untitled RFQ'}</h3>
            {description && <p className="mt-1 text-sm text-white/60">{description}</p>}
            <div className="mt-3 flex flex-wrap gap-2">
              <StatusBadge status={rfqType} />
              <Badge variant={priority === 'URGENT' ? 'destructive' : priority === 'HIGH' ? 'warning' : 'secondary'}>{priority}</Badge>
              <Badge variant="secondary">{visibility === 'PUBLIC' ? 'Public' : visibility === 'PRIVATE' ? 'Private' : 'Invite Only'}</Badge>
              <Badge variant="secondary">Expires in {expiryDays}d</Badge>
            </div>
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Package className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Products ({products.length})</span>
            </div>
            {products.map((p, i) => (
              <div key={i} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                <span className="text-sm text-white">{p.productName}</span>
                <span className="text-sm text-white/60">{p.quantity} {p.unit}{p.targetPrice ? ` @ ₹${p.targetPrice}` : ''}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Store className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Suppliers ({selectedSuppliers.length})</span>
            </div>
            {selectedSuppliers.length === 0 ? (
              <p className="text-sm text-white/40">Open to all suppliers</p>
            ) : (
              selectedSuppliers.map((s) => (
                <div key={s.companyId} className="flex items-center justify-between py-2 border-b border-white/[0.06] last:border-0">
                  <span className="text-sm text-white">{s.companyName}</span>
                  {s.matchScore && <Badge variant="success">{s.matchScore}%</Badge>}
                </div>
              ))
            )}
          </div>

          <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <MapPin className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Delivery</span>
            </div>
            {location.city && <p className="text-sm text-white">{location.city}, {location.state} {location.pincode}</p>}
            {requiredDate && <p className="text-sm text-white/60 mt-1">Required by: {new Date(requiredDate).toLocaleDateString('en-IN')}</p>}
            {paymentPreference && <p className="text-sm text-white/60 mt-1">Payment: {paymentPreference}</p>}
            {terms && <p className="text-sm text-white/60 mt-1">{terms}</p>}
            {!location.city && <p className="text-sm text-white/40">No delivery location set</p>}
          </div>

          {attachments.length > 0 && (
            <div className="rounded-lg border border-white/[0.06] bg-white/[0.04] p-4">
              <span className="text-xs font-medium uppercase tracking-wider text-white/60">Attachments ({attachments.length})</span>
              <div className="mt-2 space-y-1">
                {attachments.map((a, i) => (
                  <p key={i} className="text-sm text-white/60">{a.name} <span className="text-white/40">({a.type})</span></p>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
