export const SMS_TEMPLATES = {
  OTP_LOGIN: (otp: string) => `Your TRADINGO login code is: ${otp}. Valid for 5 minutes. Never share this code.`,
  OTP_REGISTER: (otp: string) => `Welcome to TRADINGO! Your verification code is: ${otp}. Valid for 5 minutes.`,
  OTP_RESET_PASSWORD: (otp: string) => `Your TRADINGO password reset code is: ${otp}. Valid for 5 minutes.`,
  OTP_VERIFY_MOBILE: (otp: string) => `Your TRADINGO mobile verification code is: ${otp}. Valid for 5 minutes.`,
  ORDER_CONFIRMED: (orderId: string) => `Order #${orderId.slice(0, 8).toUpperCase()} confirmed on TRADINGO. Track your order in the app.`,
  ORDER_SHIPPED: (orderId: string, tracking?: string) =>
    `Order #${orderId.slice(0, 8).toUpperCase()} has been shipped!${tracking ? ` Tracking: ${tracking}` : ''}`,
  ORDER_DELIVERED: (orderId: string) => `Order #${orderId.slice(0, 8).toUpperCase()} has been delivered. Thank you for shopping on TRADINGO!`,
  SHIPMENT_CREATED: (shipmentId: string) => `Shipment #${shipmentId.slice(0, 8).toUpperCase()} created on TRADINGO.`,
  DELIVERY_SCHEDULED: (date: string) => `Your delivery is scheduled for ${date} on TRADINGO.`,
  QUOTE_RECEIVED: () => `You have received a new quote on TRADINGO. Check your dashboard for details.`,
  NEGOTIATION_MESSAGE: () => `You have a new negotiation message on TRADINGO.`,
  PAYMENT_RECEIVED: (amount: string) => `Payment of ₹${amount} received on TRADINGO.`,
};

export const SMS_RATE_LIMITS = {
  PER_MOBILE: { windowMs: 60000, max: 5 },
  PER_MOBILE_HOURLY: { windowMs: 3600000, max: 20 },
  PER_MOBILE_DAILY: { windowMs: 86400000, max: 50 },
};
