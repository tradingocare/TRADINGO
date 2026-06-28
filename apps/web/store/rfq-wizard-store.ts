'use client';

import { create } from 'zustand';

export interface WizardProduct {
  productId?: string;
  productName: string;
  quantity: number;
  unit: string;
  targetPrice?: number;
  categoryId?: string;
  description?: string;
  isService?: boolean;
}

export interface WizardSupplier {
  companyId: string;
  companyName: string;
  matchScore?: number;
  selected: boolean;
}

export interface WizardAttachment {
  file?: File;
  url?: string;
  name: string;
  type: 'IMAGE' | 'PDF' | 'VIDEO' | 'DOCUMENT';
}

export interface WizardState {
  step: number;
  title: string;
  description: string;
  priority: 'LOW' | 'NORMAL' | 'HIGH' | 'URGENT';
  visibility: 'PUBLIC' | 'PRIVATE' | 'INVITE_ONLY';
  expiryDays: number;
  products: WizardProduct[];
  suppliers: WizardSupplier[];
  location: { city: string; state: string; country: string; pincode: string };
  requiredDate: string;
  paymentPreference: string;
  terms: string;
  attachments: WizardAttachment[];
  rfqType: 'PRODUCT' | 'SERVICE' | 'BULK' | 'URGENT';
  source: string;
  sourceId: string;

  setStep: (step: number) => void;
  update: (key: string, value: any) => void;
  addProduct: (product: WizardProduct) => void;
  removeProduct: (index: number) => void;
  updateProduct: (index: number, product: Partial<WizardProduct>) => void;
  toggleSupplier: (companyId: string) => void;
  addSuppliers: (suppliers: WizardSupplier[]) => void;
  addAttachment: (attachment: WizardAttachment) => void;
  removeAttachment: (index: number) => void;
  setSource: (source: string, sourceId?: string) => void;
  reset: () => void;
}

const initialState = {
  step: 0,
  title: '',
  description: '',
  priority: 'NORMAL' as const,
  visibility: 'PUBLIC' as const,
  expiryDays: 30,
  products: [] as WizardProduct[],
  suppliers: [] as WizardSupplier[],
  location: { city: '', state: '', country: 'India', pincode: '' },
  requiredDate: '',
  paymentPreference: '',
  terms: '',
  attachments: [] as WizardAttachment[],
  rfqType: 'PRODUCT' as const,
  source: 'DIRECT',
  sourceId: '',
};

export const useRfqWizardStore = create<WizardState>((set) => ({
  ...initialState,

  setStep: (step) => set({ step }),

  update: (key, value) => set({ [key]: value } as any),

  addProduct: (product) => set((s) => ({ products: [...s.products, product] })),

  removeProduct: (index) => set((s) => ({ products: s.products.filter((_, i) => i !== index) })),

  updateProduct: (index, product) => set((s) => ({
    products: s.products.map((p, i) => (i === index ? { ...p, ...product } : p)),
  })),

  toggleSupplier: (companyId) => set((s) => ({
    suppliers: s.suppliers.map((sp) =>
      sp.companyId === companyId ? { ...sp, selected: !sp.selected } : sp
    ),
  })),

  addSuppliers: (suppliers) => set((s) => {
    const existing = new Set(s.suppliers.map((sp) => sp.companyId));
    const newOnes = suppliers.filter((sp) => !existing.has(sp.companyId));
    return { suppliers: [...s.suppliers, ...newOnes] };
  }),

  addAttachment: (attachment) => set((s) => ({ attachments: [...s.attachments, attachment] })),

  removeAttachment: (index) => set((s) => ({ attachments: s.attachments.filter((_, i) => i !== index) })),

  setSource: (source, sourceId) => set({ source, sourceId: sourceId ?? '' }),

  reset: () => set(initialState),
}));
