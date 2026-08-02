'use client';

import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

export function StepDelivery() {
  const { location, requiredDate, paymentPreference, terms, update } = useRfqWizardStore();

  return (
    <div className="space-y-6">
      <h2 className="text-lg font-semibold text-white">Delivery Details</h2>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white/80">City *</Label>
          <Input
            placeholder="e.g. Mumbai"
            value={location.city}
            onChange={(e) => update('location', { ...location, city: e.target.value })}
            className="bg-surface border-border text-text-primary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-text-secondary">State</Label>
          <Input
            placeholder="e.g. Maharashtra"
            value={location.state}
            onChange={(e) => update('location', { ...location, state: e.target.value })}
            className="bg-surface border-border text-text-primary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-text-secondary">Country</Label>
          <Input
            value={location.country}
            onChange={(e) => update('location', { ...location, country: e.target.value })}
            className="bg-surface border-border text-text-primary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-text-secondary">Pincode</Label>
          <Input
            placeholder="e.g. 400001"
            value={location.pincode}
            onChange={(e) => update('location', { ...location, pincode: e.target.value })}
            className="bg-surface border-border text-text-primary"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-text-secondary">Required Date</Label>
          <Input
            type="date"
            value={requiredDate}
            onChange={(e) => update('requiredDate', e.target.value)}
            className="bg-surface border-border text-text-primary"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-text-secondary">Payment Preference</Label>
          <select
            value={paymentPreference}
            onChange={(e) => update('paymentPreference', e.target.value)}
            className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="" className="bg-bg-base text-text-secondary">Select payment preference</option>
            <option value="advance" className="bg-bg-base text-text-primary">Advance Payment</option>
            <option value="cod" className="bg-bg-base text-text-primary">Cash on Delivery</option>
            <option value="credit_15" className="bg-bg-base text-text-primary">15 Days Credit</option>
            <option value="credit_30" className="bg-bg-base text-text-primary">30 Days Credit</option>
            <option value="credit_60" className="bg-bg-base text-text-primary">60 Days Credit</option>
            <option value="letter_of_credit" className="bg-bg-base text-text-primary">Letter of Credit</option>
            <option value="escrow" className="bg-bg-base text-text-primary">Escrow (TRADINGO Protected)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-text-secondary">Terms & Conditions</Label>
        <Textarea
          placeholder="Enter any special terms, delivery instructions, or notes..."
          value={terms}
          onChange={(e) => update('terms', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>
    </div>
  );
}
