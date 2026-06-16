export type DraftStatus = 'INCOMPLETE' | 'COMPLETE' | 'SUBMITTED' | 'ARCHIVED';
export type FieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'SELECT' | 'MULTI_SELECT' | 'BOOLEAN' | 'DATE' | 'URL' | 'EMAIL' | 'IMAGE' | 'VIDEO' | 'PDF' | 'RICH_TEXT';
export type TemplateFieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'PRICE' | 'SELECT' | 'MULTI_SELECT' | 'CHECKBOX' | 'RADIO' | 'DATE' | 'URL' | 'PHONE' | 'FILE' | 'IMAGE' | 'VIDEO' | 'PDF' | 'LOCATION' | 'RICH_TEXT' | 'TAGS' | 'JSON';
export type ProductType = 'PHYSICAL' | 'DIGITAL' | 'SERVICE' | 'RAW_MATERIAL' | 'MACHINERY' | 'EQUIPMENT';
export type MediaType = 'IMAGE' | 'VIDEO' | 'DOCUMENT';
export type GeographicReach = 'LOCAL' | 'DISTRICT' | 'STATE' | 'PAN_INDIA' | 'GLOBAL';
export type VariantType = 'COLOR' | 'SIZE' | 'WEIGHT' | 'GRADE' | 'THICKNESS' | 'LENGTH' | 'WIDTH' | 'HEIGHT' | 'CAPACITY' | 'VOLTAGE' | 'POWER_RATING' | 'MATERIAL' | 'FINISH' | 'MODEL_NUMBER' | 'PACKAGING_TYPE' | 'DENSITY' | 'DIAMETER' | 'GSM' | 'MICRON' | 'CUSTOM';

export interface ProductDraft {
  id: string;
  companyId: string;
  categoryId?: string;
  subcategoryId?: string;
  name?: string;
  slug?: string;
  shortDescription?: string;
  description?: string;
  productType?: ProductType;
  brand?: string;
  model?: string;
  sku?: string;
  gtin?: string;
  hsCode?: string;
  moq?: number;
  unit?: string;
  visibilityRadius?: GeographicReach;
  latitude?: number;
  longitude?: number;
  isSampleOrder?: boolean;
  samplePrice?: number;
  exportSupported?: boolean;
  exportCountries?: string[];
  step: number;
  totalSteps: number;
  status: DraftStatus;
  createdAt: string;
  updatedAt: string;
  lastAutoSavedAt?: string;
  submittedAt?: string;
  draftSpecs?: ProductDraftSpec[];
  draftVariants?: ProductDraftVariant[];
  draftMedia?: ProductDraftMedia[];
  draftAttachments?: ProductDraftAttachment[];
  certifications?: ProductDraftCertification[];
  multiLangDesc?: ProductDraftMultiLangDesc[];
  priceSlabs?: ProductDraftPriceSlab[];
  completeness?: ProductCompletenessScore;
}

export interface ProductDraftSpec {
  id: string;
  draftId: string;
  key: string;
  value: string;
  sortOrder: number;
}

export interface ProductDraftVariant {
  id: string;
  draftId: string;
  variantType: VariantType;
  customName?: string;
  value: string;
  sku?: string;
  price?: number;
  compareAtPrice?: number;
  currency: string;
  quantity: number;
  isActive: boolean;
  sortOrder: number;
}

export interface ProductDraftMedia {
  id: string;
  draftId: string;
  type: MediaType;
  url: string;
  title?: string;
  altText?: string;
  fileSize?: number;
  mimeType?: string;
  isPrimary: boolean;
  sortOrder: number;
}

export interface ProductDraftAttachment {
  id: string;
  draftId: string;
  type: string;
  url: string;
  title?: string;
  fileSize?: number;
  mimeType?: string;
  sortOrder: number;
}

export interface ProductDraftCertification {
  id: string;
  draftId: string;
  type: string;
  number?: string;
  issuedBy?: string;
  issuedAt?: string;
  expiresAt?: string;
  fileUrl?: string;
  verified: boolean;
}

export interface ProductDraftMultiLangDesc {
  id: string;
  draftId: string;
  locale: string;
  name?: string;
  shortDescription?: string;
  description?: string;
  isPrimary: boolean;
}

export interface ProductDraftPriceSlab {
  id: string;
  draftId: string;
  minQty: number;
  maxQty?: number;
  price: number;
  currency: string;
}

export interface ProductCompletenessScore {
  id: string;
  draftId: string;
  total: number;
  basicInfo: number;
  specifications: number;
  media: number;
  pricing: number;
  variants: number;
  certifications: number;
  localization: number;
  logistics: number;
  lastCalculatedAt: string;
}

export interface AttributeTemplateField {
  id: string;
  templateId: string;
  key: string;
  label: string;
  type: FieldType;
  placeholder?: string;
  helpText?: string;
  defaultValue?: string;
  options: string[];
  unit?: string;
  minValue?: number;
  maxValue?: number;
  minLength?: number;
  maxLength?: number;
  required: boolean;
  conditionKey?: string;
  conditionValue?: string;
  sortOrder: number;
  isActive: boolean;
  section?: string;
}

export interface AttributeTemplate {
  id: string;
  categoryId: string;
  name: string;
  description?: string;
  isActive: boolean;
  sortOrder: number;
  fields: AttributeTemplateField[];
}

export interface WizardStep {
  id: number;
  title: string;
  subtitle: string;
  icon: string;
  sections: string[];
}

export const WIZARD_STEPS: WizardStep[] = [
  { id: 1, title: 'Basic Information', subtitle: 'Product name, category, description', icon: 'FileText', sections: ['basic'] },
  { id: 2, title: 'Specifications', subtitle: 'Technical details and attributes', icon: 'Sliders', sections: ['specifications'] },
  { id: 3, title: 'Media', subtitle: 'Images, videos, and documents', icon: 'Image', sections: ['media'] },
  { id: 4, title: 'Pricing', subtitle: 'Price, MOQ, and bulk slabs', icon: 'IndianRupee', sections: ['pricing'] },
  { id: 5, title: 'Variants', subtitle: 'Size, color, and other variations', icon: 'Layers', sections: ['variants'] },
  { id: 6, title: 'Certifications & Localization', subtitle: 'Certifications and multi-language', icon: 'ShieldCheck', sections: ['certifications', 'localization'] },
  { id: 7, title: 'Review & Submit', subtitle: 'Completeness check and publish', icon: 'Send', sections: ['review'] },
];

export interface ValidationResult {
  valid: boolean;
  errors: Record<string, string[]>;
  warnings: Record<string, string[]>;
}

export interface CategoryTemplate {
  id: string;
  categoryId: string;
  name: string;
  version: number;
  status: 'DRAFT' | 'ACTIVE' | 'ARCHIVED';
  category?: { id: string; name: string; slug: string };
  sections: TemplateSection[];
  _count?: { sections: number };
  createdAt: string;
  updatedAt: string;
}

export interface TemplateSection {
  id: string;
  templateId: string;
  key: string;
  title: string;
  description?: string;
  sortOrder: number;
  icon?: string;
  isActive: boolean;
  fields: TemplateField[];
}

export interface TemplateField {
  id: string;
  sectionId: string;
  key: string;
  label: string;
  type: TemplateFieldType;
  placeholder?: string;
  helpText?: string;
  defaultValue?: any;
  options?: any;
  unit?: string;
  validation?: any;
  visibility?: any;
  metadata?: any;
  sortOrder: number;
  isRequired: boolean;
  isActive: boolean;
}

export interface CompletenessCategory {
  key: string;
  label: string;
  score: number;
  maxScore: number;
  items: { label: string; filled: boolean; field: string }[];
}
