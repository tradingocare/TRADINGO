const SENSITIVE_KEYS = [
  'card_number', 'cardNumber', 'cc', 'cvv', 'cvv2',
  'expiry', 'exp', 'exp_month', 'exp_year',
  'pan', 'bank_account', 'account_number',
  'ifsc', 'routing_number', 'pin',
  'password', 'secret', 'token', 'otp',
  'authorization', 'signature',
];

const SENSITIVE_PATTERNS = [
  /^[0-9]{16}$/,
  /^[0-9]{4}\s[0-9]{4}\s[0-9]{4}\s[0-9]{4}$/,
];

function maskValue(value: unknown): string {
  const str = String(value);
  if (str.length <= 4) return '****';
  return str.slice(0, 4) + '****' + str.slice(-4);
}

export function maskSensitiveData(data: unknown, depth = 0): unknown {
  if (depth > 10) return data;
  if (data === null || data === undefined) return data;

  if (Array.isArray(data)) {
    return data.map(item => maskSensitiveData(item, depth + 1));
  }

  if (typeof data === 'object') {
    const masked: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
      if (SENSITIVE_KEYS.some(k => key.toLowerCase().includes(k.toLowerCase()))) {
        masked[key] = maskValue(value);
      } else if (typeof value === 'string' && SENSITIVE_PATTERNS.some(p => p.test(value))) {
        masked[key] = maskValue(value);
      } else {
        masked[key] = maskSensitiveData(value, depth + 1);
      }
    }
    return masked;
  }

  return data;
}
