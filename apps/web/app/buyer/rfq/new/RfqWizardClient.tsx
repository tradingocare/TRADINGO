'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { useRfqWizardStore } from '@/store/rfq-wizard-store';
import { useCreateSmartRfq } from '@/hooks/use-smart-rfq';
import { StepRequirement } from './steps/StepRequirement';
import { StepProducts } from './steps/StepProducts';
import { StepSuppliers } from './steps/StepSuppliers';
import { StepDelivery } from './steps/StepDelivery';
import { StepAttachments } from './steps/StepAttachments';
import { StepPreview } from './steps/StepPreview';
import { ArrowLeft, ArrowRight, Send, Save, X } from 'lucide-react';

const steps = ['Requirement', 'Products', 'Suppliers', 'Delivery', 'Attachments', 'Preview'];
const stepIcons = ['📋', '📦', '🏪', '📍', '📎', '👁'];

export function RfqWizardClient() {
  const router = useRouter();
  const { step, setStep, title, products, suppliers, reset } = useRfqWizardStore();
  const createMutation = useCreateSmartRfq();
  const [saving, setSaving] = useState(false);

  const validateStep = (s: number): boolean => {
    if (s === 0) return !!title.trim();
    if (s === 1) return products.length > 0;
    return true;
  };

  const canNext = validateStep(step);
  const isLast = step === steps.length - 1;

  const handleNext = () => { if (canNext && step < steps.length - 1) setStep(step + 1); };
  const handleBack = () => { if (step > 0) setStep(step - 1); };

  const buildPayload = (status: string) => {
    const s = useRfqWizardStore.getState();
    return {
      title: s.title,
      description: s.description,
      status,
      rfqType: s.rfqType,
      visibility: s.visibility,
      urgency: s.priority,
      source: s.source,
      sourceId: s.sourceId || undefined,
      expiresAt: s.expiryDays ? new Date(Date.now() + s.expiryDays * 86400000).toISOString() : undefined,
      productItems: s.products.map((p) => ({
        productName: p.productName,
        quantity: p.quantity,
        unit: p.unit,
        targetPrice: p.targetPrice,
        categoryId: p.categoryId,
        description: p.description,
        isService: p.isService,
      })),
      locations: s.location.city ? [{
        city: s.location.city,
        state: s.location.state,
        country: s.location.country,
        pincode: s.location.pincode,
        isPrimary: true,
      }] : undefined,
      deliveryAddress: s.location.city ? { city: s.location.city, state: s.location.state, country: s.location.country, pincode: s.location.pincode } : undefined,
      paymentPreference: s.paymentPreference || undefined,
      vendorMatches: s.suppliers.filter((sp) => sp.selected).map((sp) => ({
        companyId: sp.companyId,
      })),
    };
  };

  const handleSubmit = async () => {
    setSaving(true);
    try {
      const payload = buildPayload('ACTIVE');
      await createMutation.mutateAsync(payload);
      reset();
      router.push('/buyer/rfq');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveDraft = async () => {
    setSaving(true);
    try {
      const payload = buildPayload('DRAFT');
      await createMutation.mutateAsync(payload);
      reset();
      router.push('/buyer/rfq');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Create RFQ" description="Multi-step request for quote" />

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          {steps.map((label, i) => (
            <div key={i} className="flex items-center gap-2 flex-1">
              <button
                onClick={() => i < step ? setStep(i) : undefined}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  i === step ? 'bg-orange-500 text-white scale-110' : i < step ? 'bg-orange-500/30 text-orange-400' : 'bg-white/[0.06] text-white/40'
                }`}
              >
                {i < step ? '✓' : i + 1}
              </button>
              <span className={`hidden text-xs font-medium sm:block ${i === step ? 'text-orange-400' : i < step ? 'text-white/60' : 'text-white/40'}`}>
                {label}
              </span>
              {i < steps.length - 1 && <div className={`h-px flex-1 ${i < step ? 'bg-orange-500/50' : 'bg-white/[0.06]'}`} />}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-6 backdrop-blur-xl">
        {step === 0 && <StepRequirement />}
        {step === 1 && <StepProducts />}
        {step === 2 && <StepSuppliers />}
        {step === 3 && <StepDelivery />}
        {step === 4 && <StepAttachments />}
        {step === 5 && <StepPreview />}
      </div>

      <div className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-xl">
        <div>
          {step > 0 && (
            <Button variant="ghost" onClick={handleBack}>
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={handleSaveDraft} disabled={saving}>
            <Save className="mr-2 h-4 w-4" />
            Save Draft
          </Button>
          {isLast ? (
            <Button variant="accent" onClick={handleSubmit} disabled={saving || !canNext}>
              <Send className="mr-2 h-4 w-4" />
              {saving ? 'Submitting...' : 'Submit RFQ'}
            </Button>
          ) : (
            <Button variant="accent" onClick={handleNext} disabled={!canNext}>
              Next
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
