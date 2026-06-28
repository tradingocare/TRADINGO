import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { buyerApi } from '@/lib/api/buyer';

export function useBuyerDashboard() {
  return useQuery({ queryKey: ['buyer', 'dashboard'], queryFn: () => buyerApi.dashboard.get() });
}

export function useSavedSuppliers() {
  return useQuery({ queryKey: ['buyer', 'saved-suppliers'], queryFn: () => buyerApi.savedSuppliers.list() });
}

export function useSaveSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { companyId: string; notes?: string; tags?: string[] }) => buyerApi.savedSuppliers.save(data.companyId, data.notes, data.tags),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'saved-suppliers'] }); },
  });
}

export function useUpdateSavedSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; notes?: string; tags?: string[] }) => buyerApi.savedSuppliers.update(data.id, data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'saved-suppliers'] }); },
  });
}

export function useRemoveSavedSupplier() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buyerApi.savedSuppliers.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'saved-suppliers'] }); },
  });
}

export function useCheckSavedSupplier(companyId: string) {
  return useQuery({
    queryKey: ['buyer', 'saved-suppliers', 'check', companyId],
    queryFn: () => buyerApi.savedSuppliers.check(companyId),
    enabled: !!companyId,
  });
}

export function useRequirementLists(status?: string) {
  return useQuery({ queryKey: ['buyer', 'requirements', status], queryFn: () => buyerApi.requirements.list(status) });
}

export function useRequirementList(id: string) {
  return useQuery({
    queryKey: ['buyer', 'requirements', id],
    queryFn: () => buyerApi.requirements.get(id),
    enabled: !!id,
  });
}

export function useCreateRequirementList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: any) => buyerApi.requirements.create(data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'requirements'] }); },
  });
}

export function useUpdateRequirementList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { id: string; body: any }) => buyerApi.requirements.update(data.id, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'requirements'] }); },
  });
}

export function useDeleteRequirementList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buyerApi.requirements.remove(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'requirements'] }); },
  });
}

export function useAddRequirementItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listId: string; item: any }) => buyerApi.requirements.addItem(data.listId, data.item),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'requirements'] }); },
  });
}

export function useUpdateRequirementItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listId: string; itemId: string; body: any }) => buyerApi.requirements.updateItem(data.listId, data.itemId, data.body),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'requirements'] }); },
  });
}

export function useRemoveRequirementItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: { listId: string; itemId: string }) => buyerApi.requirements.removeItem(data.listId, data.itemId),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'requirements'] }); },
  });
}

export function useBuyerNotifications(type?: string, limit?: number, offset?: number) {
  return useQuery({ queryKey: ['buyer', 'notifications', type, limit, offset], queryFn: () => buyerApi.notifications.list(type, limit, offset) });
}

export function useBuyerUnreadCount() {
  return useQuery({ queryKey: ['buyer', 'notifications', 'unread-count'], queryFn: () => buyerApi.notifications.unreadCount() });
}

export function useMarkBuyerNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => buyerApi.notifications.markRead(id),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'notifications'] }); },
  });
}

export function useMarkAllBuyerNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => buyerApi.notifications.markAllRead(),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['buyer', 'notifications'] }); },
  });
}

export function useBuyerDownloads(limit?: number, offset?: number) {
  return useQuery({ queryKey: ['buyer', 'downloads', limit, offset], queryFn: () => buyerApi.downloads.list(limit, offset) });
}

export function useBuyerAnalyticsOverview() {
  return useQuery({ queryKey: ['buyer', 'analytics', 'overview'], queryFn: () => buyerApi.analytics.overview() });
}

export function useBuyerAnalyticsSpending() {
  return useQuery({ queryKey: ['buyer', 'analytics', 'spending'], queryFn: () => buyerApi.analytics.spending() });
}

export function useBuyerAnalyticsTopProducts() {
  return useQuery({ queryKey: ['buyer', 'analytics', 'top-products'], queryFn: () => buyerApi.analytics.categories() });
}
