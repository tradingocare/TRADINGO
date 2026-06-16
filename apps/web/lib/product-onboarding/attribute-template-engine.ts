import { apiClient } from '@/lib/api/client';
import type { AttributeTemplate, AttributeTemplateField } from './types';

interface CachedTemplate {
  template: AttributeTemplate;
  fetchedAt: number;
}

const cache = new Map<string, CachedTemplate>();
const TTL_MS = 5 * 60 * 1000;

export async function getTemplateForCategory(categoryId: string): Promise<AttributeTemplate> {
  const cached = cache.get(categoryId);
  if (cached && Date.now() - cached.fetchedAt < TTL_MS) {
    return cached.template;
  }

  const res = await apiClient.get<AttributeTemplate>(`/attribute-templates/category/${categoryId}`);
  const template = res.data;

  cache.set(categoryId, { template, fetchedAt: Date.now() });
  return template;
}

export function getFieldByKey(template: AttributeTemplate, key: string): AttributeTemplateField | undefined {
  return template.fields.find((f) => f.key === key);
}

export function getSections(template: AttributeTemplate): string[] {
  const sections = new Set<string>();
  for (const field of template.fields) {
    if (field.section) {
      sections.add(field.section);
    }
  }
  return Array.from(sections).sort();
}

export function getFieldsBySection(
  template: AttributeTemplate,
  sectionName: string,
): AttributeTemplateField[] {
  return template.fields
    .filter((f) => f.section === sectionName && f.isActive)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function evaluateConditions(
  template: AttributeTemplate,
  formValues: Record<string, unknown>,
): AttributeTemplateField[] {
  return template.fields.filter((field) => {
    if (!field.conditionKey || !field.conditionValue) return true;
    const conditionValue = formValues[field.conditionKey];
    return String(conditionValue) === field.conditionValue;
  });
}

export function getDefaultValues(
  template: AttributeTemplate,
): Record<string, string> {
  const defaults: Record<string, string> = {};
  for (const field of template.fields) {
    if (field.defaultValue !== undefined && field.defaultValue !== null) {
      defaults[field.key] = field.defaultValue;
    }
  }
  return defaults;
}

export function invalidateCache(categoryId?: string): void {
  if (categoryId) {
    cache.delete(categoryId);
  } else {
    cache.clear();
  }
}
