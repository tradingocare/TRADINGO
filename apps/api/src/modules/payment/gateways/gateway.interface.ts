export interface PaymentGatewayOrder {
  id: string;
  gatewayOrderId: string;
  amount: number;
  currency: string;
  keyId?: string;
}

export interface PaymentGatewayVerifyParams {
  gatewayOrderId: string;
  gatewayPaymentId: string;
  gatewaySignature: string;
}

export interface PaymentGatewayRefundParams {
  gatewayPaymentId: string;
  amount: number;
  notes?: Record<string, string>;
}

export interface PaymentGatewayRefundResult {
  id: string;
  status: string;
}

export interface IPaymentGateway {
  readonly name: string;
  createOrder(amount: number, currency: string, receipt: string, notes?: Record<string, string>): Promise<PaymentGatewayOrder>;
  verifyPayment(params: PaymentGatewayVerifyParams): boolean;
  verifyWebhookSignature(rawBody: string, signature: string): boolean;
  fetchPayment(gatewayPaymentId: string): Promise<any>;
  createRefund(params: PaymentGatewayRefundParams): Promise<PaymentGatewayRefundResult>;
  getKeyId(): string;
}
