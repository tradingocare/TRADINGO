import type {
  AttributeTemplate,
  ProductDraft,
  ProductDraftSpec,
  ProductDraftVariant,
  ProductDraftMedia,
  ProductDraftAttachment,
  ProductDraftCertification,
  ProductDraftMultiLangDesc,
  ProductDraftPriceSlab,
} from './types';

export interface FormState {
  values: Record<string, unknown>;
  touched: Record<string, boolean>;
  errors: Record<string, string[]>;
}

const STEP_SECTION_MAP: Record<number, string[]> = {
  1: ['basic'],
  2: ['specifications'],
  3: ['media'],
  4: ['pricing'],
  5: ['variants'],
  6: ['certifications', 'localization'],
  7: ['review'],
};

export function createInitialFormState(
  template?: AttributeTemplate,
  draft?: ProductDraft,
): FormState {
  const values: Record<string, unknown> = {};
  const touched: Record<string, boolean> = {};
  const errors: Record<string, string[]> = {};

  if (template) {
    for (const field of template.fields) {
      if (!field.isActive) continue;

      if (draft && draft[field.key as keyof ProductDraft] !== undefined) {
        values[field.key] = draft[field.key as keyof ProductDraft];
      } else if (field.defaultValue !== undefined && field.defaultValue !== null) {
        values[field.key] = field.defaultValue;
      } else if (field.type === 'BOOLEAN') {
        values[field.key] = false;
      } else if (field.type === 'MULTI_SELECT') {
        values[field.key] = [];
      } else {
        values[field.key] = '';
      }
    }
  }

  return { values, touched, errors };
}

export function updateField(
  formState: FormState,
  key: string,
  value: unknown,
): FormState {
  return {
    values: { ...formState.values, [key]: value },
    touched: { ...formState.touched, [key]: true },
    errors: formState.errors,
  };
}

export function getStepFields(
  formState: FormState,
  template: AttributeTemplate,
  stepId: number,
): AttributeTemplate['fields'] {
  const sections = STEP_SECTION_MAP[stepId] || [];

  return template.fields.filter((f) => {
    if (!f.isActive) return false;
    return sections.includes(f.section || '');
  });
}

export function isStepComplete(
  formState: FormState,
  template: AttributeTemplate,
  stepId: number,
): boolean {
  const sections = STEP_SECTION_MAP[stepId] || [];
  const stepFields = template.fields.filter((f) => {
    if (!f.isActive) return false;
    if (!f.required) return false;
    return sections.includes(f.section || '');
  });

  return stepFields.every((field) => {
    const value = formState.values[field.key];
    if (value === undefined || value === null) return false;
    if (typeof value === 'string' && value.trim().length === 0) return false;
    if (Array.isArray(value) && value.length === 0) return false;
    return true;
  });
}

export function getFormDataForApi(
  formState: FormState,
  template: AttributeTemplate,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  for (const field of template.fields) {
    if (!field.isActive) continue;
    const value = formState.values[field.key];
    if (value !== undefined && value !== null && value !== '') {
      data[field.key] = value;
    }
  }

  return data;
}

export function applyDraftToForm(
  formState: FormState,
  draft: ProductDraft,
): FormState {
  const newValues: Record<string, unknown> = { ...formState.values };
  const newTouched: Record<string, boolean> = { ...formState.touched };

  const draftMap: Record<string, unknown> = {
    name: draft.name,
    slug: draft.slug,
    shortDescription: draft.shortDescription,
    description: draft.description,
    productType: draft.productType,
    brand: draft.brand,
    model: draft.model,
    sku: draft.sku,
    gtin: draft.gtin,
    hsCode: draft.hsCode,
    moq: draft.moq,
    unit: draft.unit,
    visibilityRadius: draft.visibilityRadius,
    latitude: draft.latitude,
    longitude: draft.longitude,
    isSampleOrder: draft.isSampleOrder,
    samplePrice: draft.samplePrice,
    exportSupported: draft.exportSupported,
    exportCountries: draft.exportCountries,
    categoryId: draft.categoryId,
    subcategoryId: draft.subcategoryId,
    step: draft.step,
    totalSteps: draft.totalSteps,
    status: draft.status,
  };

  for (const [key, value] of Object.entries(draftMap)) {
    if (value !== undefined && value !== null) {
      newValues[key] = value;
    }
  }

  return {
    values: newValues,
    touched: newTouched,
    errors: formState.errors,
  };
}

export function collectChangedFields(
  oldState: FormState,
  newState: FormState,
): Record<string, unknown> {
  const changed: Record<string, unknown> = {};

  for (const key of Object.keys(newState.values)) {
    const oldVal = oldState.values[key];
    const newVal = newState.values[key];

    if (JSON.stringify(oldVal) !== JSON.stringify(newVal)) {
      changed[key] = newVal;
    }
  }

  return changed;
}

export function getFormDataWithRelations(
  draft: ProductDraft,
): Record<string, unknown> {
  const data: Record<string, unknown> = {};

  if (draft.name !== undefined) data.name = draft.name;
  if (draft.slug !== undefined) data.slug = draft.slug;
  if (draft.shortDescription !== undefined) data.shortDescription = draft.shortDescription;
  if (draft.description !== undefined) data.description = draft.description;
  if (draft.productType !== undefined) data.productType = draft.productType;
  if (draft.brand !== undefined) data.brand = draft.brand;
  if (draft.model !== undefined) data.model = draft.model;
  if (draft.sku !== undefined) data.sku = draft.sku;
  if (draft.gtin !== undefined) data.gtin = draft.gtin;
  if (draft.hsCode !== undefined) data.hsCode = draft.hsCode;
  if (draft.moq !== undefined) data.moq = draft.moq;
  if (draft.unit !== undefined) data.unit = draft.unit;
  if (draft.visibilityRadius !== undefined) data.visibilityRadius = draft.visibilityRadius;
  if (draft.latitude !== undefined) data.latitude = draft.latitude;
  if (draft.longitude !== undefined) data.longitude = draft.longitude;
  if (draft.isSampleOrder !== undefined) data.isSampleOrder = draft.isSampleOrder;
  if (draft.samplePrice !== undefined) data.samplePrice = draft.samplePrice;
  if (draft.exportSupported !== undefined) data.exportSupported = draft.exportSupported;
  if (draft.exportCountries !== undefined) data.exportCountries = draft.exportCountries;
  if (draft.categoryId !== undefined) data.categoryId = draft.categoryId;
  if (draft.subcategoryId !== undefined) data.subcategoryId = draft.subcategoryId;
  if (draft.step !== undefined) data.step = draft.step;
  if (draft.totalSteps !== undefined) data.totalSteps = draft.totalSteps;
  if (draft.status !== undefined) data.status = draft.status;

  if (draft.draftSpecs && draft.draftSpecs.length > 0) {
    data.draftSpecs = draft.draftSpecs.map((s: ProductDraftSpec) => ({
      key: s.key,
      value: s.value,
      sortOrder: s.sortOrder,
    }));
  }

  if (draft.draftVariants && draft.draftVariants.length > 0) {
    data.draftVariants = draft.draftVariants.map((v: ProductDraftVariant) => ({
      variantType: v.variantType,
      customName: v.customName,
      value: v.value,
      sku: v.sku,
      price: v.price,
      compareAtPrice: v.compareAtPrice,
      currency: v.currency,
      quantity: v.quantity,
      isActive: v.isActive,
      sortOrder: v.sortOrder,
    }));
  }

  if (draft.draftMedia && draft.draftMedia.length > 0) {
    data.draftMedia = draft.draftMedia.map((m: ProductDraftMedia) => ({
      type: m.type,
      url: m.url,
      title: m.title,
      altText: m.altText,
      fileSize: m.fileSize,
      mimeType: m.mimeType,
      isPrimary: m.isPrimary,
      sortOrder: m.sortOrder,
    }));
  }

  if (draft.draftAttachments && draft.draftAttachments.length > 0) {
    data.draftAttachments = draft.draftAttachments.map((a: ProductDraftAttachment) => ({
      type: a.type,
      url: a.url,
      title: a.title,
      fileSize: a.fileSize,
      mimeType: a.mimeType,
      sortOrder: a.sortOrder,
    }));
  }

  if (draft.certifications && draft.certifications.length > 0) {
    data.certifications = draft.certifications.map((c: ProductDraftCertification) => ({
      type: c.type,
      number: c.number,
      issuedBy: c.issuedBy,
      issuedAt: c.issuedAt,
      expiresAt: c.expiresAt,
      fileUrl: c.fileUrl,
      verified: c.verified,
    }));
  }

  if (draft.multiLangDesc && draft.multiLangDesc.length > 0) {
    data.multiLangDesc = draft.multiLangDesc.map((l: ProductDraftMultiLangDesc) => ({
      locale: l.locale,
      name: l.name,
      shortDescription: l.shortDescription,
      description: l.description,
      isPrimary: l.isPrimary,
    }));
  }

  if (draft.priceSlabs && draft.priceSlabs.length > 0) {
    data.priceSlabs = draft.priceSlabs.map((p: ProductDraftPriceSlab) => ({
      minQty: p.minQty,
      maxQty: p.maxQty,
      price: p.price,
      currency: p.currency,
    }));
  }

  return data;
}

export function createFormStateFromDraft(
  template: AttributeTemplate,
  draft: ProductDraft,
): FormState {
  return applyDraftToForm(createInitialFormState(template), draft);
}
