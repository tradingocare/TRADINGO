export function renderTemplate(template: string, context: Record<string, unknown>): string {
  const templates: Record<string, string> = {
    welcome: `<h1>Welcome to Tradingo!</h1><p>Hello {{name}},</p><p>Your account has been created successfully.</p>`,
    'email-verification': `<h1>Verify Your Email</h1><p>Hello {{name}},</p><p>Please verify your email address.</p>`,
    'password-reset': `<h1>Password Reset</h1><p>Hello {{name}},</p><p>Click the link below to reset your password.</p>`,
    notification: `<h1>Notification</h1><p>Hello {{name}},</p><p>{{message}}</p>`,
  };

  const html = templates[template] || `<p>${template}</p>`;
  return html.replace(/\{\{(\w+)\}\}/g, (_, key) => (context[key] as string) || '');
}
