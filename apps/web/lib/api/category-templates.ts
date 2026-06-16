import { apiClient } from './client';
import type { CategoryTemplate } from '@/lib/product-onboarding/types';

export async function getTemplates(): Promise<CategoryTemplate[]> {
  const { data } = await apiClient.get<CategoryTemplate[]>('/admin/templates');
  return data;
}

export async function getTemplate(id: string): Promise<CategoryTemplate> {
  const { data } = await apiClient.get<CategoryTemplate>(`/admin/templates/${id}`);
  return data;
}

export async function createTemplate(payload: { categoryId: string; name: string; status?: string }): Promise<CategoryTemplate> {
  const { data } = await apiClient.post<CategoryTemplate>('/admin/templates', payload);
  return data;
}

export async function updateTemplate(id: string, payload: Partial<{ name: string; status: string }>): Promise<CategoryTemplate> {
  const { data } = await apiClient.patch<CategoryTemplate>(`/admin/templates/${id}`, payload);
  return data;
}

export async function deleteTemplate(id: string): Promise<void> {
  await apiClient.delete(`/admin/templates/${id}`);
}

export async function duplicateTemplate(id: string): Promise<CategoryTemplate> {
  const { data } = await apiClient.post<CategoryTemplate>(`/admin/templates/${id}/duplicate`);
  return data;
}

export async function activateTemplate(id: string): Promise<CategoryTemplate> {
  const { data } = await apiClient.post<CategoryTemplate>(`/admin/templates/${id}/activate`);
  return data;
}

export async function exportTemplateJson(id: string): Promise<any> {
  const { data } = await apiClient.get(`/admin/templates/${id}/export`);
  return data;
}

export async function importTemplateJson(categoryId: string, json: any): Promise<CategoryTemplate> {
  const { data } = await apiClient.post<CategoryTemplate>(`/admin/templates/import/${categoryId}`, json);
  return data;
}

export async function addSection(templateId: string, payload: { key: string; title: string; sortOrder?: number; icon?: string }): Promise<any> {
  const { data } = await apiClient.post(`/admin/templates/${templateId}/sections`, payload);
  return data;
}

export async function updateSection(sectionId: string, payload: any): Promise<any> {
  const { data } = await apiClient.patch(`/admin/templates/sections/${sectionId}`, payload);
  return data;
}

export async function deleteSection(sectionId: string): Promise<void> {
  await apiClient.delete(`/admin/templates/sections/${sectionId}`);
}

export async function addField(sectionId: string, payload: any): Promise<any> {
  const { data } = await apiClient.post(`/admin/templates/sections/${sectionId}/fields`, payload);
  return data;
}

export async function updateField(fieldId: string, payload: any): Promise<any> {
  const { data } = await apiClient.patch(`/admin/templates/fields/${fieldId}`, payload);
  return data;
}

export async function deleteField(fieldId: string): Promise<void> {
  await apiClient.delete(`/admin/templates/fields/${fieldId}`);
}

export async function getActiveTemplate(categoryId: string): Promise<CategoryTemplate | null> {
  try {
    const { data } = await apiClient.get<CategoryTemplate>(`/categories/${categoryId}/template`);
    return data;
  } catch {
    return null;
  }
}
