import type {
  AttributeTemplate,
  AttributeTemplateField,
  ValidationResult,
  ProductDraftVariant,
  ProductDraftPriceSlab,
} from './types';

function validateEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function validateUrl(url: string): boolean {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
}

function validateRequired(value: unknown, field: AttributeTemplateField): string | null {
  if (!field.required) return null;
  if (value === undefined || value === null) return `${field.label} is required`;
  if (typeof value === 'string' && value.trim().length === 0) return `${field.label} is required`;
  if (Array.isArray(value) && value.length === 0) return `${field.label} is required`;
  return null;
}

function validateMinMaxLength(value: string, field: AttributeTemplateField): string | null {
  if (typeof value !== 'string') return null;
  const len = value.trim().length;
  if (field.minLength !== undefined && len < field.minLength) {
    return `${field.label} must be at least ${field.minLength} characters`;
  }
  if (field.maxLength !== undefined && len > field.maxLength) {
    return `${field.label} must be at most ${field.maxLength} characters`;
  }
  return null;
}

function validateMinMaxValue(value: number, field: AttributeTemplateField): string | null {
  if (typeof value !== 'number') return null;
  if (field.minValue !== undefined && value < field.minValue) {
    return `${field.label} must be at least ${field.minValue}`;
  }
  if (field.maxValue !== undefined && value > field.maxValue) {
    return `${field.label} must be at most ${field.maxValue}`;
  }
  return null;
}

function validateSelectOptions(value: string | string[], field: AttributeTemplateField): string | null {
  if (!value || (Array.isArray(value) && value.length === 0)) return null;

  if (field.type === 'MULTI_SELECT') {
    const values = Array.isArray(value) ? value : [value];
    const invalid = values.filter((v) => !field.options.includes(v));
    if (invalid.length > 0) {
      return `${field.label}: invalid options: ${invalid.join(', ')}`;
    }
    return null;
  }

  if (typeof value === 'string' && value.length > 0 && !field.options.includes(value)) {
    return `${field.label}: "${value}" is not a valid option`;
  }
  return null;
}

export function validateField(
  field: AttributeTemplateField,
  value: unknown,
): string[] {
  const errors: string[] = [];

  const requiredErr = validateRequired(value, field);
  if (requiredErr) {
    errors.push(requiredErr);
    return errors;
  }

  if (value === undefined || value === null || value === '') return errors;

  switch (field.type) {
    case 'TEXT':
    case 'TEXTAREA':
    case 'RICH_TEXT':
      if (typeof value === 'string') {
        const lenErr = validateMinMaxLength(value, field);
        if (lenErr) errors.push(lenErr);
      }
      break;

    case 'NUMBER':
      if (typeof value === 'number' || (typeof value === 'string' && value.trim().length > 0)) {
        const num = typeof value === 'number' ? value : Number(value);
        if (isNaN(num)) {
          errors.push(`${field.label} must be a valid number`);
        } else {
          const rangeErr = validateMinMaxValue(num, field);
          if (rangeErr) errors.push(rangeErr);
        }
      }
      break;

    case 'EMAIL':
      if (typeof value === 'string' && !validateEmail(value)) {
        errors.push(`${field.label} must be a valid email address`);
      }
      break;

    case 'URL':
      if (typeof value === 'string' && !validateUrl(value)) {
        errors.push(`${field.label} must be a valid URL`);
      }
      break;

    case 'SELECT':
    case 'MULTI_SELECT':
      if (field.options.length > 0) {
        const optErr = validateSelectOptions(
          Array.isArray(value) ? value : String(value),
          field,
        );
        if (optErr) errors.push(optErr);
      }
      break;

    case 'BOOLEAN':
      if (typeof value !== 'boolean' && value !== 'true' && value !== 'false') {
        errors.push(`${field.label} must be a boolean value`);
      }
      break;

    case 'DATE':
      if (typeof value === 'string') {
        const parsed = Date.parse(value);
        if (isNaN(parsed)) {
          errors.push(`${field.label} must be a valid date`);
        }
      }
      break;
  }

  return errors;
}

export function validateStep(
  formValues: Record<string, unknown>,
  template: AttributeTemplate,
  stepId: number,
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};
  const stepFields = template.fields.filter((f) => {
    const stepSectionMap: Record<number, string[]> = {
      1: ['basic'],
      2: ['specifications'],
      3: ['media'],
      4: ['pricing'],
      5: ['variants'],
      6: ['certifications', 'localization'],
      7: ['review'],
    };
    const sections = stepSectionMap[stepId] || [];
    return sections.includes(f.section || '');
  });

  for (const field of stepFields) {
    if (!field.isActive) continue;
    const fieldErrors = validateField(field, formValues[field.key]);
    if (fieldErrors.length > 0) {
      errors[field.key] = fieldErrors;
    }
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors, warnings };
}

export function validateAll(
  formValues: Record<string, unknown>,
  template: AttributeTemplate,
): ValidationResult {
  const errors: Record<string, string[]> = {};
  const warnings: Record<string, string[]> = {};

  for (const field of template.fields) {
    if (!field.isActive) continue;
    const fieldErrors = validateField(field, formValues[field.key]);
    if (fieldErrors.length > 0) {
      errors[field.key] = fieldErrors;
    }
  }

  const valid = Object.keys(errors).length === 0;
  return { valid, errors, warnings };
}

export function validateVariant(
  variant: Partial<ProductDraftVariant>,
): string[] {
  const errors: string[] = [];
  if (!variant.variantType) errors.push('Variant type is required');
  if (!variant.value || (typeof variant.value === 'string' && variant.value.trim().length === 0)) {
    errors.push('Variant value is required');
  }
  if (variant.price !== undefined && variant.price < 0) {
    errors.push('Price cannot be negative');
  }
  if (variant.quantity !== undefined && variant.quantity < 0) {
    errors.push('Quantity cannot be negative');
  }
  if (variant.compareAtPrice !== undefined && variant.price !== undefined && variant.compareAtPrice < variant.price) {
    errors.push('Compare-at price should be greater than or equal to price');
  }
  return errors;
}

export function validatePriceSlab(
  slab: Partial<ProductDraftPriceSlab>,
): string[] {
  const errors: string[] = [];
  const minQty = slab.minQty;
  const maxQty = slab.maxQty;
  const price = slab.price;

  if (minQty === undefined || minQty === null || minQty < 1) {
    errors.push('Minimum quantity must be at least 1');
  }
  if (maxQty !== undefined && maxQty !== null && minQty !== undefined && maxQty <= minQty) {
    errors.push('Maximum quantity must be greater than minimum quantity');
  }
  if (price === undefined || price <= 0) {
    errors.push('Price must be greater than 0');
  }
  if (!slab.currency || slab.currency.trim().length === 0) {
    errors.push('Currency is required');
  }
  return errors;
}

export { validateEmail, validateUrl };
