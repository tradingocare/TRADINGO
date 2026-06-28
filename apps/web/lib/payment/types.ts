export type PaymentGateway = 'RAZORPAY' | 'CASHFREE' | 'PHONEPE' | 'STRIPE' | 'BANK_TRANSFER' | 'UPI_QR'

export interface PaymentProvider {
  name: string
  key: PaymentGateway
  icon: string
  supported: boolean
}

export interface PaymentOrder {
  orderId: string
  amount: number
  currency: string
  description: string
}

export interface PaymentResult {
  success: boolean
  paymentId?: string
  gatewayPaymentId?: string
  gatewaySignature?: string
  error?: string
}

export interface PlanTier {
  id: string
  label: string
  multiplier: number
}

export const PLAN_TIERS: PlanTier[] = [
  { id: 'A', label: 'Plan A (Annual)', multiplier: 1 },
  { id: 'B', label: 'Plan B (Biannual)', multiplier: 2 },
  { id: 'C', label: 'Plan C (Quarterly)', multiplier: 3 },
]

export const PROVIDERS: PaymentProvider[] = [
  { name: 'Razorpay', key: 'RAZORPAY', icon: '💰', supported: true },
  { name: 'Cashfree', key: 'CASHFREE', icon: '💸', supported: false },
  { name: 'PhonePe', key: 'PHONEPE', icon: '📱', supported: false },
  { name: 'Stripe', key: 'STRIPE', icon: '💳', supported: false },
  { name: 'Bank Transfer', key: 'BANK_TRANSFER', icon: '🏦', supported: true },
  { name: 'UPI QR', key: 'UPI_QR', icon: '📲', supported: true },
]
