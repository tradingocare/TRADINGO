import type { PaymentGateway, PaymentOrder, PaymentResult } from './types'

interface PaymentProviderImpl {
  name: string
  key: PaymentGateway
  initialize(order: PaymentOrder): Promise<PaymentResult>
  process(): Promise<PaymentResult>
}

class RazorpayProvider implements PaymentProviderImpl {
  name = 'Razorpay'
  key: PaymentGateway = 'RAZORPAY'

  async initialize(order: PaymentOrder): Promise<PaymentResult> {
    return { success: true }
  }

  async process(): Promise<PaymentResult> {
    return { success: true, paymentId: 'mock_' + Date.now(), gatewayPaymentId: 'pay_' + Date.now(), gatewaySignature: 'sig_' + Date.now() }
  }
}

class BankTransferProvider implements PaymentProviderImpl {
  name = 'Bank Transfer'
  key: PaymentGateway = 'BANK_TRANSFER'

  async initialize(order: PaymentOrder): Promise<PaymentResult> {
    return { success: true }
  }

  async process(): Promise<PaymentResult> {
    return { success: true, paymentId: 'bt_' + Date.now() }
  }
}

class UpiQrProvider implements PaymentProviderImpl {
  name = 'UPI QR'
  key: PaymentGateway = 'UPI_QR'

  async initialize(order: PaymentOrder): Promise<PaymentResult> {
    return { success: true }
  }

  async process(): Promise<PaymentResult> {
    return { success: true, paymentId: 'upi_' + Date.now() }
  }
}

const providers: Record<string, PaymentProviderImpl> = {
  RAZORPAY: new RazorpayProvider(),
  BANK_TRANSFER: new BankTransferProvider(),
  UPI_QR: new UpiQrProvider(),
}

export function getPaymentProvider(key: PaymentGateway): PaymentProviderImpl {
  const provider = providers[key]
  if (!provider) throw new Error(`Unsupported payment provider: ${key}`)
  return provider
}
