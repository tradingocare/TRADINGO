'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { DashboardPageHeader } from '@/components/dashboard';
import { FormWizard } from '@/components/product-onboarding/form-wizard';
import { DynamicForm } from '@/components/product-onboarding/dynamic-form';
import { VariantMatrix } from '@/components/product-onboarding/variant-matrix';
import { PricingSlabs as PricingSlabsEditor } from '@/components/product-onboarding/pricing-slabs';
import { CompletenessGauge } from '@/components/product-onboarding/completeness-gauge';
import { FileUploadZone } from '@/components/product-onboarding/file-upload-zone';
import { MultiLangEditor } from '@/components/product-onboarding/multi-lang-editor';
import { CertificationEditor } from '@/components/product-onboarding/certification-editor';
import { AttachmentList } from '@/components/product-onboarding/attachment-list';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { useToast } from '@/components/ui/use-toast';
import { apiClient } from '@/lib/api-client';
import { WIZARD_STEPS, type ProductDraft, type AttributeTemplate, type ProductCompletenessScore, type ProductDraftSpec, type ProductDraftVariant, type ProductDraftMedia, type ProductDraftAttachment, type ProductDraftCertification, type ProductDraftMultiLangDesc, type ProductDraftPriceSlab, type AttributeTemplateField } from '@/lib/product-onboarding/types';
import { getTemplateForCategory } from '@/lib/product-onboarding/attribute-template-engine';
import { validateStep, validateAll } from '@/lib/product-onboarding/validation-engine';
import { createInitialFormState, type FormState } from '@/lib/product-onboarding/form-engine';
import { WizardCopilot, useWizardAi } from '@/components/ai/wizard-copilot';
import { Loader2, CheckCircle, Image as ImageIcon, Send, Eye, Sparkles } from 'lucide-react';

function buildApiPayload(formState: FormState, extras: {
  specs: ProductDraftSpec[]; variants: ProductDraftVariant[]; media: ProductDraftMedia[];
  attachments: ProductDraftAttachment[]; certifications: ProductDraftCertification[];
  multiLangDesc: ProductDraftMultiLangDesc[]; priceSlabs: ProductDraftPriceSlab[];
  step: number;
}): Record<string, unknown> {
  return {
    ...formState.values,
    specs: extras.specs.map(s => ({ key: s.key, value: s.value, sortOrder: s.sortOrder })),
    variants: extras.variants.map(v => ({ variantType: v.variantType, customName: v.customName, value: v.value, sku: v.sku, price: v.price, compareAtPrice: v.compareAtPrice, currency: v.currency, quantity: v.quantity, sortOrder: v.sortOrder })),
    media: extras.media.map(m => ({ type: m.type, url: m.url, title: m.title, altText: m.altText, isPrimary: m.isPrimary, sortOrder: m.sortOrder })),
    attachments: extras.attachments.map(a => ({ type: a.type, url: a.url, title: a.title, sortOrder: a.sortOrder })),
    certifications: extras.certifications.map(c => ({ type: c.type, number: c.number, issuedBy: c.issuedBy, issuedAt: c.issuedAt, expiresAt: c.expiresAt, fileUrl: c.fileUrl })),
    multiLangDescriptions: extras.multiLangDesc.map(l => ({ locale: l.locale, name: l.name, shortDescription: l.shortDescription, description: l.description, isPrimary: l.isPrimary })),
    priceSlabs: extras.priceSlabs.map(p => ({ minQty: p.minQty, maxQty: p.maxQty, price: p.price, currency: p.currency })),
    step: extras.step,
  };
}

export function NewProductWizard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const draftId = searchParams.get('draftId');
  const { toast: showToast } = useToast();

  const [draft, setDraft] = useState<ProductDraft | null>(null);
  const [template, setTemplate] = useState<AttributeTemplate | null>(null);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [lastAutoSavedAt, setLastAutoSavedAt] = useState<string | undefined>();
  const [formState, setFormState] = useState<FormState>({ values: {}, touched: {}, errors: {} });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [completeness, setCompleteness] = useState<ProductCompletenessScore | null>(null);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [specs, setSpecs] = useState<ProductDraftSpec[]>([]);
  const [variants, setVariants] = useState<ProductDraftVariant[]>([]);
  const [media, setMedia] = useState<ProductDraftMedia[]>([]);
  const [attachments, setAttachments] = useState<ProductDraftAttachment[]>([]);
  const [certifications, setCertifications] = useState<ProductDraftCertification[]>([]);
  const [multiLangDesc, setMultiLangDesc] = useState<ProductDraftMultiLangDesc[]>([]);
  const [priceSlabs, setPriceSlabs] = useState<ProductDraftPriceSlab[]>([]);
  const autoSaveTimer = useRef<NodeJS.Timeout | null>(null);
  const { aiLoading, handleAiGenerate } = useWizardAi();

  const v = formState.values as Record<string, any>;

  const loadDraft = useCallback(async (id: string) => {
    try {
      const data = await apiClient.get<ProductDraft>(`/product-onboarding/draft/${id}`);
      setDraft(data);
      setCurrentStep(data.step);
      setSpecs(data.draftSpecs || []);
      setVariants(data.draftVariants || []);
      setMedia(data.draftMedia || []);
      setAttachments(data.draftAttachments || []);
      setCertifications(data.certifications || []);
      setMultiLangDesc(data.multiLangDesc || []);
      setPriceSlabs(data.priceSlabs || []);
      if (data.completeness) setCompleteness(data.completeness);
      if (data.categoryId) {
        const tpl = await getTemplateForCategory(data.categoryId);
        setTemplate(tpl);
        setFormState(createInitialFormState(tpl, data));
      } else {
        setFormState(createInitialFormState());
      }
    } catch {
      showToast({ title: 'Failed to load draft', variant: 'destructive' });
      router.push('/seller/products');
    }
  }, [showToast, router]);

  useEffect(() => {
    apiClient.get<{ data: { id: string; name: string }[] }>('/categories?page=1&limit=100')
      .then(res => setCategories(res.data || []))
      .catch(() => { showToast({ title: 'Failed to load categories', variant: 'destructive' }); });
  }, []);

  useEffect(() => {
    (async () => {
      if (draftId) await loadDraft(draftId);
      else setFormState(createInitialFormState());
      setLoading(false);
    })();
  }, [draftId, loadDraft]);

  useEffect(() => {
    const handler = (e: Event) => {
      const detail = (e as CustomEvent).detail
      if (detail.description) handleFieldChange('description', detail.description)
      if (detail.shortDescription) handleFieldChange('shortDescription', detail.shortDescription)
      if (detail.hsCode) handleFieldChange('hsCode', detail.hsCode)
      if (detail.specs && Array.isArray(detail.specs)) {
        setSpecs(detail.specs.map((s: any, i: number) => ({ id: `ai-${i}`, draftId: draft?.id || '', key: s.key || s.name || `spec_${i}`, value: s.value || '', sortOrder: i })))
      }
      if (detail.imageSuggestions) {
        showToast({ title: 'AI Image Suggestions', description: typeof detail.imageSuggestions === 'string' ? detail.imageSuggestions : JSON.stringify(detail.imageSuggestions), variant: 'default' })
      }
      if (detail.pricing) {
        if (Array.isArray(detail.pricing.slabs)) setPriceSlabs(detail.pricing.slabs)
      }
      if (detail.translation) {
        setMultiLangDesc((prev) => {
          const existing = prev.filter((p) => p.locale !== detail.translation.locale)
          return [...existing, { id: `ai-${detail.translation.locale}`, draftId: draft?.id || '', locale: detail.translation.locale, name: detail.translation.name || v.name || '', shortDescription: detail.translation.shortDescription || v.shortDescription || '', description: detail.translation.description || v.description || '', isPrimary: false }]
        })
      }
      if (detail.score) {
        showToast({ title: `Quality Score: ${detail.score.total || 0}/100`, description: (detail.score.recommendations || []).slice(0, 3).join(', '), variant: 'default' })
      }
    }
    window.addEventListener('wizard-ai-fill', handler)
    return () => window.removeEventListener('wizard-ai-fill', handler)
  }, [draft?.id, v.name, v.shortDescription, v.description])

  const handleCategoryChange = async (categoryId: string) => {
    try {
      const tpl = await getTemplateForCategory(categoryId);
      setTemplate(tpl);
      setFormState((prev) => {
        const init = createInitialFormState(tpl);
        return { values: { ...init.values, ...prev.values, categoryId }, touched: prev.touched, errors: prev.errors };
      });
    } catch { showToast({ title: 'Failed to load template for category', variant: 'destructive' }); }
  };

  const handleFieldChange = (key: string, value: any) => {
    setFormState((prev) => ({
      values: { ...prev.values, [key]: value },
      touched: { ...prev.touched, [key]: true },
      errors: prev.errors,
    }));
    if (key === 'categoryId' && value) handleCategoryChange(value);
    setErrors((prev) => { const n = { ...prev }; delete n[key]; return n; });
  };

  const handleStepChange = (step: number) => {
    if (step <= currentStep) { setCurrentStep(step); return; }
    if (template) {
      const stepResult = validateStep(v, template, currentStep);
      if (!stepResult.valid) {
        setErrors(stepResult.errors);
        showToast({ title: 'Please fix errors', variant: 'destructive' });
        return;
      }
    }
    setCurrentStep(step);
    setErrors({});
  };

  const handleSaveDraft = async () => {
    if (!draft) { showToast({ title: 'No draft to save', variant: 'destructive' }); return; }
    setIsSaving(true);
    try {
      await apiClient.patch(`/product-onboarding/draft/${draft.id}`, buildApiPayload(formState, {
        specs, variants, media, attachments, certifications, multiLangDesc, priceSlabs, step: currentStep,
      }));
      showToast({ title: 'Draft saved' });
    } catch { showToast({ title: 'Save failed', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const handleCreateDraft = async () => {
    setIsSaving(true);
    try {
      const created = await apiClient.post<ProductDraft>('/product-onboarding/draft', buildApiPayload(formState, {
        specs, variants, media, attachments, certifications, multiLangDesc, priceSlabs, step: currentStep,
      }));
      setDraft(created);
      router.push(`/seller/products/new?draftId=${created.id}`, { scroll: false });
      showToast({ title: 'Draft created', description: 'You can now save and resume later.' });
    } catch { showToast({ title: 'Failed to create draft', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  };

  const handleAutoSave = useCallback(async () => {
    if (!draft) return;
    setIsSaving(true);
    try {
      await apiClient.post(`/product-onboarding/draft/${draft.id}/auto-save`, buildApiPayload(formState, {
        specs, variants, media, attachments, certifications, multiLangDesc, priceSlabs, step: currentStep,
      }));
      setLastAutoSavedAt(new Date().toISOString());
    } catch { showToast({ title: 'Auto-save failed', variant: 'destructive' }); }
    finally { setIsSaving(false); }
  }, [draft, formState, specs, variants, media, attachments, certifications, multiLangDesc, priceSlabs, currentStep]);

  useEffect(() => {
    if (!draft) return;
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(handleAutoSave, 30000);
    return () => { if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current); };
  }, [formState, specs, variants, media, handleAutoSave, draft]);

  const handleSubmit = async () => {
    if (!draft) return;
    if (template) {
      const allResult = validateAll(v, template);
      if (!allResult.valid) { setErrors(allResult.errors); showToast({ title: 'Validation failed', variant: 'destructive' }); return; }
    }
    setSubmitting(true);
    try {
      await apiClient.post(`/product-onboarding/draft/${draft.id}/submit`, buildApiPayload(formState, {
        specs, variants, media, attachments, certifications, multiLangDesc, priceSlabs, step: currentStep,
      }));
      showToast({ title: 'Product published!' });
      router.push('/seller/products');
    } catch { showToast({ title: 'Submission failed', variant: 'destructive' }); }
    finally { setSubmitting(false); }
  };

  const handleRecalculateCompleteness = async () => {
    if (!draft) return;
    try { setCompleteness(await apiClient.get<ProductCompletenessScore>(`/product-onboarding/draft/${draft.id}/completeness`)); }
    catch { /* ignore */ }
  };

  useEffect(() => { if (draft && !completeness) handleRecalculateCompleteness(); }, [draft]);

  if (loading) return (
    <div className="space-y-6">
      <DashboardPageHeader title="New Product" description="Add a new product to your catalog" />
      <div className="flex items-center justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-text-tertiary" /></div>
    </div>
  );

  const stepFields = template ? template.fields.filter(f => f.isActive) : [];

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="New Product" description="Add a new product to your catalog" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-4">
        <div className="lg:col-span-3">
          <FormWizard
            steps={WIZARD_STEPS}
            currentStep={currentStep}
            onStepChange={handleStepChange}
            onSave={draft ? handleSaveDraft : handleCreateDraft}
            isSaving={isSaving}
            lastAutoSavedAt={lastAutoSavedAt}
            completeness={completeness}
          >
            {currentStep === 1 && (
              <div className="space-y-6">
                <Card><CardContent className="space-y-4 pt-6">
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div className="sm:col-span-2">
                      <Label>Product Name *</Label>
                      <Input value={v.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} placeholder="e.g., Stainless Steel 316L Coils" />
                      {errors.name && <p className="mt-1 text-xs text-red-500">{errors.name[0]}</p>}
                    </div>
                    <div>
                      <Label>Category *</Label>
                      <select value={v.categoryId || ''} onChange={(e) => handleFieldChange('categoryId', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
                        <option value="">Select category</option>
                        {categories.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                      {errors.categoryId && <p className="mt-1 text-xs text-red-500">{errors.categoryId[0]}</p>}
                    </div>
                    <div>
                      <Label>Product Type *</Label>
                      <select value={v.productType || 'PHYSICAL'} onChange={(e) => handleFieldChange('productType', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
                        <option value="PHYSICAL">Physical Product</option>
                        <option value="DIGITAL">Digital Product</option>
                        <option value="SERVICE">Service</option>
                        <option value="RAW_MATERIAL">Raw Material</option>
                        <option value="MACHINERY">Machinery</option>
                        <option value="EQUIPMENT">Equipment</option>
                      </select>
                    </div>
                    <div><Label>Brand</Label><Input value={v.brand || ''} onChange={(e) => handleFieldChange('brand', e.target.value)} placeholder="e.g., Tata Steel" /></div>
                    <div><Label>Model / Grade</Label><Input value={v.model || ''} onChange={(e) => handleFieldChange('model', e.target.value)} placeholder="e.g., 316L" /></div>
                    <div className="sm:col-span-2"><Label>Short Description</Label><Textarea value={v.shortDescription || ''} onChange={(e) => handleFieldChange('shortDescription', e.target.value)} placeholder="Brief summary (max 200 chars)" rows={2} /></div>
                    <div className="sm:col-span-2"><Label>Full Description</Label><Textarea value={v.description || ''} onChange={(e) => handleFieldChange('description', e.target.value)} placeholder="Detailed product description" rows={4} /></div>
                    <div><Label>SKU / Product Code</Label><Input value={v.sku || ''} onChange={(e) => handleFieldChange('sku', e.target.value)} placeholder="e.g., STL-316L-001" /></div>
                    <div><Label>HS Code</Label><Input value={v.hsCode || ''} onChange={(e) => handleFieldChange('hsCode', e.target.value)} placeholder="e.g., 7219.32" /></div>
                    <div><Label>GTIN / EAN</Label><Input value={v.gtin || ''} onChange={(e) => handleFieldChange('gtin', e.target.value)} placeholder="Global Trade Item Number" /></div>
                    <div>
                      <Label>Unit</Label>
                      <select value={v.unit || ''} onChange={(e) => handleFieldChange('unit', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
                        <option value="">Select unit</option>
                        {['kg','ton','pcs','m','l','box','roll','sheet','set','pair'].map(u => <option key={u} value={u}>{u}</option>)}
                      </select>
                    </div>
                    <div><Label>Minimum Order Qty (MOQ)</Label><Input type="number" min={1} value={v.moq ?? ''} onChange={(e) => handleFieldChange('moq', parseInt(e.target.value) || '')} placeholder="e.g., 100" /></div>
                  </div>
                </CardContent></Card>

                <Card><CardContent className="space-y-4 pt-6">
                  <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Logistics & Reach</h3>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <Label>Geographic Reach</Label>
                      <select value={v.visibilityRadius || ''} onChange={(e) => handleFieldChange('visibilityRadius', e.target.value)} className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-text-primary dark:border-dark-border dark:bg-dark-surface dark:text-dark-text-primary">
                        <option value="">Select reach</option>
                        <option value="LOCAL">Local</option><option value="DISTRICT">District</option><option value="STATE">State</option><option value="PAN_INDIA">Pan India</option><option value="GLOBAL">Global</option>
                      </select>
                    </div>
                    <div className="flex items-end gap-2">
                      <div className="flex-1"><Label>Latitude</Label><Input type="number" step="any" value={v.latitude ?? ''} onChange={(e) => handleFieldChange('latitude', parseFloat(e.target.value) || '')} placeholder="e.g., 19.0760" /></div>
                      <div className="flex-1"><Label>Longitude</Label><Input type="number" step="any" value={v.longitude ?? ''} onChange={(e) => handleFieldChange('longitude', parseFloat(e.target.value) || '')} placeholder="e.g., 72.8777" /></div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Label className="flex items-center gap-2"><input type="checkbox" checked={!!v.isSampleOrder} onChange={(e) => handleFieldChange('isSampleOrder', e.target.checked)} className="rounded border-border" /> Sample Order Available</Label>
                      <Label className="flex items-center gap-2"><input type="checkbox" checked={!!v.exportSupported} onChange={(e) => handleFieldChange('exportSupported', e.target.checked)} className="rounded border-border" /> Export Supported</Label>
                    </div>
                  </div>
                  {v.exportSupported && (
                    <div><Label>Export Countries (comma separated)</Label><Input value={(v.exportCountries || []).join(', ')} onChange={(e) => handleFieldChange('exportCountries', e.target.value.split(',').map((s: string) => s.trim()).filter(Boolean))} placeholder="e.g., UAE, USA, UK, Singapore" /></div>
                  )}
                </CardContent></Card>
                <WizardCopilot currentStep={currentStep} formValues={v} aiLoading={aiLoading} onGenerate={handleAiGenerate} />
              </div>
            )}

            {currentStep === 2 && (
              <div className="space-y-6">
                <Card><CardContent className="pt-6">
                  {template ? (
                    <DynamicForm fields={stepFields as AttributeTemplateField[]} values={v} errors={errors} onChange={handleFieldChange} template={template} />
                  ) : (
                    <p className="text-sm text-text-secondary">Select a category first to see dynamic specification fields.</p>
                  )}
                </CardContent></Card>
                <WizardCopilot currentStep={currentStep} formValues={v} aiLoading={aiLoading} onGenerate={handleAiGenerate} />
              </div>
            )}

            {currentStep === 3 && (
              <div className="space-y-6">
                <Card><CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Product Images & Videos</h3>
                  <FileUploadZone accept="image/*,video/*" multiple maxFiles={10} maxSize={10} files={media.map(m => new File([], m.url.split('/').pop() || 'file'))} onFilesChange={() => {}} type="media" />
                  {media.length > 0 && (
                    <div className="mt-4 grid grid-cols-4 gap-2">
                      {media.map((m, i) => (
                        <div key={m.id || i} className="relative aspect-square rounded-lg border border-border bg-surface-secondary overflow-hidden">
                          {m.type === 'IMAGE' ? <img src={m.url} alt={m.title || ''} className="h-full w-full object-cover" /> : <div className="flex h-full items-center justify-center text-text-tertiary"><ImageIcon className="h-8 w-8" /></div>}
                          <button onClick={() => setMedia((prev) => prev.filter((_, j) => j !== i))} className="absolute right-1 top-1 rounded-full bg-red-500 p-0.5 text-white"><svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg></button>
                          {m.isPrimary && <span className="absolute bottom-1 left-1 rounded bg-accent-500 px-1 py-0.5 text-[10px] text-white">Primary</span>}
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent></Card>
                <Card><CardContent className="pt-6">
                  <h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Attachments (PDFs, Datasheets, Brochures)</h3>
                  <FileUploadZone accept=".pdf,.doc,.docx,.xls,.xlsx" multiple maxFiles={20} maxSize={20} files={[]} onFilesChange={() => {}} type="attachment" />
                  <AttachmentList attachments={attachments} onChange={setAttachments} types={['pdf','brochure','datasheet','msds','other']} />
                </CardContent></Card>
                <WizardCopilot currentStep={currentStep} formValues={v} aiLoading={aiLoading} onGenerate={handleAiGenerate} />
              </div>
            )}

            {currentStep === 4 && (
              <div className="space-y-6">
                <Card><CardContent className="pt-6">
                  <PricingSlabsEditor slabs={priceSlabs} onSlabsChange={setPriceSlabs} moq={v.moq || 0} onMoqChange={(val) => handleFieldChange('moq', val)} unit={v.unit || ''} onUnitChange={(val) => handleFieldChange('unit', val)} />
                </CardContent></Card>
                <WizardCopilot currentStep={currentStep} formValues={v} aiLoading={aiLoading} onGenerate={handleAiGenerate} />
              </div>
            )}

            {currentStep === 5 && (
              <Card><CardContent className="pt-6">
                <VariantMatrix variants={variants} onVariantsChange={setVariants} basePrice={priceSlabs[0]?.price || 0} />
              </CardContent></Card>
            )}

            {currentStep === 6 && (
              <div className="space-y-6">
                <Card><CardContent className="pt-6"><h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Certifications</h3><CertificationEditor certifications={certifications} onChange={setCertifications} /></CardContent></Card>
                <Card><CardContent className="pt-6"><h3 className="mb-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Multi-Language Descriptions</h3><MultiLangEditor entries={multiLangDesc} onChange={setMultiLangDesc} primaryName={v.name || ''} /></CardContent></Card>
                <WizardCopilot currentStep={currentStep} formValues={v} aiLoading={aiLoading} onGenerate={handleAiGenerate} />
              </div>
            )}

            {currentStep === 7 && (
              <div className="space-y-6">
                <Card><CardContent className="pt-6">
                  <div className="flex items-center justify-between"><h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary">Completeness Check</h3><div className="flex gap-2"><Button variant="outline" size="sm" onClick={handleRecalculateCompleteness}><Eye className="mr-1.5 h-3.5 w-3.5" /> Refresh</Button><WizardCopilot currentStep={currentStep} formValues={v} aiLoading={aiLoading} onGenerate={handleAiGenerate} /></div></div>
                  <CompletenessGauge score={completeness} draft={draft} />
                </CardContent></Card>

                <Card><CardContent className="pt-6">
                  <h3 className="mb-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Product Summary</h3>
                  <div className="space-y-2 text-sm">
                    {[{l:'Name',val:v.name},{l:'Category',val:v.categoryId},{l:'Type',val:v.productType},{l:'Specifications',val:`${specs.length} fields`},{l:'Images',val:media.filter(m=>m.type==='IMAGE').length},{l:'Videos',val:media.filter(m=>m.type==='VIDEO').length},{l:'Variants',val:variants.length},{l:'Pricing Slabs',val:priceSlabs.length},{l:'Certifications',val:certifications.length},{l:'Languages',val:multiLangDesc.length>0?`${multiLangDesc.length} languages`:'English only'}].map(({l,val}) => (
                      <div key={l} className="flex justify-between border-b border-border py-1 dark:border-dark-border last:border-0"><span className="text-text-secondary">{l}</span><span className="font-medium text-text-primary dark:text-dark-text-primary">{String(val ?? '—')}</span></div>
                    ))}
                  </div>
                </CardContent></Card>

                <div className="flex justify-center">
                  <Button size="lg" onClick={handleSubmit} disabled={submitting || (completeness !== null && completeness.total < 40)}>
                    {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
                    {submitting ? 'Publishing...' : 'Publish Product'}
                  </Button>
                </div>
                {completeness !== null && completeness.total < 40 && <p className="text-center text-xs text-amber-500">Complete at least 40% before publishing</p>}
              </div>
            )}
          </FormWizard>
        </div>

        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <Card><CardContent className="pt-6"><h3 className="mb-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Completeness</h3><CompletenessGauge score={completeness} draft={draft} /></CardContent></Card>
            <Card><CardContent className="pt-6">
              <h3 className="mb-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Quick Steps</h3>
              <ul className="space-y-2">{WIZARD_STEPS.map((s) => {
                const isActive = s.id === currentStep, isPast = s.id < currentStep;
                return (
                  <li key={s.id}>
                    <button onClick={() => handleStepChange(s.id)} className={`flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-colors ${isActive ? 'bg-accent-50 text-accent-700 dark:bg-accent-900/20 dark:text-accent-400' : isPast ? 'text-text-primary hover:bg-surface-secondary dark:text-dark-text-primary dark:hover:bg-dark-surface-secondary' : 'text-text-tertiary'}`}>
                      {isPast ? <CheckCircle className="h-4 w-4 text-accent-500" /> : <span className={`flex h-4 w-4 items-center justify-center rounded-full text-[10px] font-bold ${isActive ? 'bg-accent-500 text-white' : 'bg-surface-secondary text-text-tertiary dark:bg-dark-surface-secondary'}`}>{s.id}</span>}
                      <span className="truncate">{s.title}</span>
                    </button>
                  </li>
                );
              })}</ul>
            </CardContent></Card>
            {draft && (
              <Card><CardContent className="pt-6">
                <h3 className="mb-3 text-sm font-semibold text-text-primary dark:text-dark-text-primary">Draft Info</h3>
                <div className="space-y-1 text-xs text-text-secondary dark:text-dark-text-secondary">
                  <p>ID: {draft.id.slice(0,8)}...</p><p>Status: {draft.status}</p><p>Step: {draft.step}/{draft.totalSteps}</p>
                  <p>Created: {new Date(draft.createdAt).toLocaleDateString('en-IN')}</p>
                  {draft.lastAutoSavedAt && <p>Last auto-save: {new Date(draft.lastAutoSavedAt).toLocaleTimeString('en-IN')}</p>}
                </div>
              </CardContent></Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
