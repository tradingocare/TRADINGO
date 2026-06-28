import { v4 as uuid } from 'uuid';

export function generateInvoiceNumber(): string {
  const now = new Date();
  const datePart = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}`;
  const randomPart = uuid().slice(0, 6).toUpperCase();
  return `INV-${datePart}-${randomPart}`;
}

export function calculateGst(amount: number, gstRate = 0.18): number {
  return Math.round(amount * gstRate);
}

export function formatInvoiceAmount(amount: number, currency = 'INR'): string {
  return `${currency} ${(amount / 100).toFixed(2)}`;
}
