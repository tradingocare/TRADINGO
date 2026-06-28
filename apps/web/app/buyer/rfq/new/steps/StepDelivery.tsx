'use client';

import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';

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
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">State</Label>
          <Input
            placeholder="e.g. Maharashtra"
            value={location.state}
            onChange={(e) => update('location', { ...location, state: e.target.value })}
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Country</Label>
          <Input
            value={location.country}
            onChange={(e) => update('location', { ...location, country: e.target.value })}
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Pincode</Label>
          <Input
            placeholder="e.g. 400001"
            value={location.pincode}
            onChange={(e) => update('location', { ...location, pincode: e.target.value })}
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label className="text-white/80">Required Date</Label>
          <Input
            type="date"
            value={requiredDate}
            onChange={(e) => update('requiredDate', e.target.value)}
            className="bg-white/[0.04] border-white/[0.06] text-white"
          />
        </div>
        <div className="space-y-2">
          <Label className="text-white/80">Payment Preference</Label>
          <select
            value={paymentPreference}
            onChange={(e) => update('paymentPreference', e.target.value)}
            className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50"
          >
            <option value="" className="bg-gray-900 text-white/60">Select payment preference</option>
            <option value="advance" className="bg-gray-900 text-white">Advance Payment</option>
            <option value="cod" className="bg-gray-900 text-white">Cash on Delivery</option>
            <option value="credit_15" className="bg-gray-900 text-white">15 Days Credit</option>
            <option value="credit_30" className="bg-gray-900 text-white">30 Days Credit</option>
            <option value="credit_60" className="bg-gray-900 text-white">60 Days Credit</option>
            <option value="letter_of_credit" className="bg-gray-900 text-white">Letter of Credit</option>
            <option value="escrow" className="bg-gray-900 text-white">Escrow (TRADINGO Protected)</option>
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <Label className="text-white/80">Terms & Conditions</Label>
        <textarea
          placeholder="Enter any special terms, delivery instructions, or notes..."
          value={terms}
          onChange={(e) => update('terms', e.target.value)}
          rows={3}
          className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
        />
      </div>
    </div>
  );
}
