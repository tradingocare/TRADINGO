import { create } from 'zustand'

interface Plan {
  id: string; planId: string; name: string; description: string
  pricePlanA: number; pricePlanB: number; pricePlanC: number
  features: string[]; sortOrder: number
}

interface CompanyInfo {
  id: string; name: string; businessType: string
  gstNumber: string; panNumber: string; ownerName: string
  mobile: string; email: string
  city: string; state: string; addressLine1: string; pincode: string
}

interface BillingDetails {
  contactName: string; address: string; city: string; state: string
  pincode: string; country: string; gstBilling: boolean
  invoiceName: string; invoiceEmail: string; invoiceMobile: string
}

interface CouponState {
  code: string; validated: boolean
  discountType: 'PERCENTAGE' | 'FIXED' | null
  discountValue: number | null; maxDiscount: number | null; minAmount: number | null
  error: string | null
}

interface ReferralState {
  code: string; validated: boolean
  referrerName: string | null; rewardAmount: number | null
  error: string | null
}

interface TermsState {
  membership: boolean; refund: boolean; privacy: boolean; seller: boolean
}

interface CheckoutState {
  currentStep: number
  plan: Plan | null
  tier: 'A' | 'B' | 'C'
  companyInfo: CompanyInfo | null
  billing: BillingDetails
  coupon: CouponState
  referral: ReferralState
  rmCode: string
  terms: TermsState
  paymentMethod: string | null
  orderCreated: boolean
  orderId: string | null
  loading: boolean

  setPlan: (plan: Plan) => void
  setTier: (tier: 'A' | 'B' | 'C') => void
  setCompanyInfo: (info: CompanyInfo) => void
  setBilling: (billing: Partial<BillingDetails>) => void
  setCouponCode: (code: string) => void
  setCouponValidated: (data: { discountType: string; discountValue: number; maxDiscount: number | null; minAmount: number | null }) => void
  setCouponError: (error: string) => void
  clearCoupon: () => void
  setReferralCode: (code: string) => void
  setReferralValidated: (data: { referrerName: string; rewardAmount: number }) => void
  setReferralError: (error: string) => void
  clearReferral: () => void
  setRmCode: (code: string) => void
  setTerms: (terms: Partial<TermsState>) => void
  setPaymentMethod: (method: string | null) => void
  setOrderCreated: (orderId: string) => void
  nextStep: () => void
  prevStep: () => void
  goToStep: (step: number) => void
  setLoading: (loading: boolean) => void
  reset: () => void
}

const defaultBilling: BillingDetails = {
  contactName: '', address: '', city: '', state: '',
  pincode: '', country: 'India', gstBilling: false,
  invoiceName: '', invoiceEmail: '', invoiceMobile: '',
}

const defaultTerms: TermsState = {
  membership: false, refund: false, privacy: false, seller: false,
}

export const useCheckoutStore = create<CheckoutState>((set, get) => ({
  currentStep: 1,
  plan: null,
  tier: 'A',
  companyInfo: null,
  billing: { ...defaultBilling },
  coupon: { code: '', validated: false, discountType: null, discountValue: null, maxDiscount: null, minAmount: null, error: null },
  referral: { code: '', validated: false, referrerName: null, rewardAmount: null, error: null },
  rmCode: '',
  terms: { ...defaultTerms },
  paymentMethod: null,
  orderCreated: false,
  orderId: null,
  loading: false,

  setPlan: (plan) => set({ plan }),
  setTier: (tier) => {
    set({ tier, coupon: { code: '', validated: false, discountType: null, discountValue: null, maxDiscount: null, minAmount: null, error: null } })
  },
  setCompanyInfo: (info) => set({ companyInfo: info }),
  setBilling: (partial) => set((s) => ({ billing: { ...s.billing, ...partial } })),
  setCouponCode: (code) => set((s) => ({ coupon: { ...s.coupon, code, validated: false, error: null } })),
  setCouponValidated: (data) => set((s) => ({
    coupon: {
      ...s.coupon,
      validated: true,
      discountType: data.discountType as 'PERCENTAGE' | 'FIXED',
      discountValue: data.discountValue,
      maxDiscount: data.maxDiscount,
      minAmount: data.minAmount,
      error: null,
    },
  })),
  setCouponError: (error) => set((s) => ({ coupon: { ...s.coupon, validated: false, error } })),
  clearCoupon: () => set({ coupon: { code: '', validated: false, discountType: null, discountValue: null, maxDiscount: null, minAmount: null, error: null } }),
  setReferralCode: (code) => set((s) => ({ referral: { ...s.referral, code, validated: false, error: null } })),
  setReferralValidated: (data) => set((s) => ({
    referral: { ...s.referral, validated: true, referrerName: data.referrerName, rewardAmount: data.rewardAmount, error: null },
  })),
  setReferralError: (error) => set((s) => ({ referral: { ...s.referral, validated: false, error } })),
  clearReferral: () => set({ referral: { code: '', validated: false, referrerName: null, rewardAmount: null, error: null } }),
  setRmCode: (rmCode) => set({ rmCode }),
  setTerms: (partial) => set((s) => ({ terms: { ...s.terms, ...partial } })),
  setPaymentMethod: (method) => set({ paymentMethod: method }),
  setOrderCreated: (orderId) => set({ orderCreated: true, orderId }),
  nextStep: () => set((s) => ({ currentStep: Math.min(s.currentStep + 1, 9) })),
  prevStep: () => set((s) => ({ currentStep: Math.max(s.currentStep - 1, 1) })),
  goToStep: (step) => set({ currentStep: step }),
  setLoading: (loading) => set({ loading }),
  reset: () => set({
    currentStep: 1, plan: null, tier: 'A', companyInfo: null,
    billing: { ...defaultBilling },
    coupon: { code: '', validated: false, discountType: null, discountValue: null, maxDiscount: null, minAmount: null, error: null },
    referral: { code: '', validated: false, referrerName: null, rewardAmount: null, error: null },
    rmCode: '', terms: { ...defaultTerms },
    paymentMethod: null, orderCreated: false, orderId: null, loading: false,
  }),
}))

export function usePrice() {
  const { plan, tier, coupon, billing } = useCheckoutStore()
  if (!plan) return { price: 0, discount: 0, gst: 0, total: 0, savings: 0, renewalAmount: 0 }

  const basePrice = tier === 'B' ? plan.pricePlanB : tier === 'C' ? plan.pricePlanC : plan.pricePlanA
  const pricePa = plan.pricePlanA

  let discount = 0
  if (coupon.validated && coupon.discountValue) {
    if (coupon.discountType === 'PERCENTAGE') {
      discount = Math.round(basePrice * coupon.discountValue / 100)
      if (coupon.maxDiscount) discount = Math.min(discount, coupon.maxDiscount)
    } else {
      discount = coupon.discountValue
    }
  }

  const taxableAmount = basePrice - discount
  const gst = billing.gstBilling ? Math.round(taxableAmount * 0.18) : 0
  const total = taxableAmount + gst

  const annualPrice = plan.pricePlanA
  const savings = tier === 'A' ? 0 : basePrice - annualPrice

  return {
    price: basePrice,
    discount,
    gst,
    total,
    savings,
    renewalAmount: annualPrice,
  }
}

export type { Plan, CompanyInfo, BillingDetails, CouponState, ReferralState, TermsState }
