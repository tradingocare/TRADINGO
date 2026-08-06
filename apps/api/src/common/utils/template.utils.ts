export function renderTemplate(template: string, context: Record<string, unknown>): string {
  const templates: Record<string, string> = {
    welcome: `<h1>Welcome to Tradingo!</h1><p>Hello {{name}},</p><p>Your account has been created successfully.</p><p>Please verify your email: <a href="{{verificationUrl}}?token={{verificationToken}}">Verify Email</a></p>`,
    'email-verification': `<h1>Verify Your Email</h1><p>Hello {{name}},</p><p>Please verify your email by clicking the link below:</p><p><a href="{{verificationUrl}}?token={{verificationToken}}">Verify Email</a></p><p>This link expires in 24 hours.</p>`,
    'password-reset': `<h1>Password Reset</h1><p>Hello {{name}},</p><p>Your OTP to reset your password is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;padding:12px;background:#f5f5f5;border-radius:6px">{{otp}}</p><p>This OTP expires in 5 minutes.</p>`,
    'otp-login': `<h1>Login OTP</h1><p>Hello {{name}},</p><p>Your login OTP is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;padding:12px;background:#f5f5f5;border-radius:6px">{{otp}}</p><p>This OTP expires in 5 minutes.</p>`,
    'otp-verify': `<h1>Verify Your {{type}}</h1><p>Your verification OTP is:</p><p style="font-size:24px;font-weight:bold;letter-spacing:4px;text-align:center;padding:12px;background:#f5f5f5;border-radius:6px">{{otp}}</p><p>This OTP expires in 5 minutes.</p>`,
    notification: `<h1>Notification</h1><p>Hello {{name}},</p><p>{{message}}</p>`,
  };

  const html = templates[template] || `<p>${template}</p>`;
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => (context[key] as string) || '');
}
