import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { tradeservApi } from '@/lib/api/tradeserv';

export function useProfessionalProfile(slug: string) {
  return useQuery({
    queryKey: ['tradeserv', 'professional', slug],
    queryFn: () => tradeservApi.getProfessional(slug),
    enabled: !!slug,
  });
}

export function useProfessionalSummary(slug: string) {
  return useQuery({
    queryKey: ['tradeserv', 'professional-summary', slug],
    queryFn: () => tradeservApi.getProfessionalSummary(slug),
    enabled: !!slug,
  });
}

export function useSearchProfessionals(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['tradeserv', 'search', params],
    queryFn: () => tradeservApi.searchProfessionals(params),
    enabled: true,
  });
}

export function useFeaturedProfessionals(limit = 10) {
  return useQuery({
    queryKey: ['tradeserv', 'featured', limit],
    queryFn: () => tradeservApi.getFeatured(limit),
  });
}

export function useProfessionalCategories() {
  return useQuery({
    queryKey: ['tradeserv', 'categories'],
    queryFn: () => tradeservApi.getCategories(),
  });
}

export function useEnrichedCategories() {
  return useQuery({
    queryKey: ['tradeserv', 'categories', 'enriched'],
    queryFn: () => tradeservApi.getEnrichedCategories(),
  });
}

export function useResolveCategory(name: string) {
  return useQuery({
    queryKey: ['tradeserv', 'categories', 'resolve', name],
    queryFn: () => tradeservApi.resolveCategory(name),
    enabled: !!name,
  });
}

export function useEnrichedService(id: string) {
  return useQuery({
    queryKey: ['tradeserv', 'services', id, 'enriched'],
    queryFn: () => tradeservApi.getEnrichedService(id),
    enabled: !!id,
  });
}

export function useRegisterProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.register,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv'] }),
  });
}

export function useMyProfile() {
  return useQuery({
    queryKey: ['tradeserv', 'my-profile'],
    queryFn: () => tradeservApi.getMyProfile(),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.updateProfile,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'my-profile'] }),
  });
}

export function useDashboard() {
  return useQuery({
    queryKey: ['tradeserv', 'dashboard'],
    queryFn: () => tradeservApi.getDashboard(),
  });
}

export function useServices() {
  return useQuery({
    queryKey: ['tradeserv', 'services'],
    queryFn: () => tradeservApi.getServices(),
  });
}

export function useAddService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.addService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'services'] }),
  });
}

export function useUpdateService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => tradeservApi.updateService(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'services'] }),
  });
}

export function useDeleteService() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.deleteService,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'services'] }),
  });
}

export function usePortfolio() {
  return useQuery({
    queryKey: ['tradeserv', 'portfolio'],
    queryFn: () => tradeservApi.getPortfolio(),
  });
}

export function useAddPortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.addPortfolioItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'portfolio'] }),
  });
}

export function useUpdatePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => tradeservApi.updatePortfolioItem(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'portfolio'] }),
  });
}

export function useDeletePortfolioItem() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.deletePortfolioItem,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'portfolio'] }),
  });
}

export function useCertifications() {
  return useQuery({
    queryKey: ['tradeserv', 'certifications'],
    queryFn: () => tradeservApi.getCertifications(),
  });
}

export function useAddCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.addCertification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'certifications'] }),
  });
}

export function useUpdateCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Record<string, unknown> }) => tradeservApi.updateCertification(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'certifications'] }),
  });
}

export function useDeleteCertification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.deleteCertification,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'certifications'] }),
  });
}

export function useAvailability() {
  return useQuery({
    queryKey: ['tradeserv', 'availability'],
    queryFn: () => tradeservApi.getAvailability(),
  });
}

export function useSetAvailability() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.setAvailability,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'availability'] }),
  });
}

export function useAddLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.addLanguage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'my-profile'] }),
  });
}

export function useRemoveLanguage() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.removeLanguage,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'my-profile'] }),
  });
}

export function useBookings() {
  return useQuery({
    queryKey: ['tradeserv', 'bookings'],
    queryFn: () => tradeservApi.getBookings(),
  });
}

export function useCreateBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.createBooking,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'bookings'] }),
  });
}

export function useUpdateBookingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; cancelReason?: string; meetingLink?: string } }) =>
      tradeservApi.updateBookingStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'bookings'] }),
  });
}

export function useCreateReview() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.createReview,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv'] }),
  });
}

export function useReviews(companyId: string) {
  return useQuery({
    queryKey: ['tradeserv', 'reviews', companyId],
    queryFn: () => tradeservApi.getReviews(companyId),
    enabled: !!companyId,
  });
}

export function useProposals() {
  return useQuery({
    queryKey: ['tradeserv', 'proposals'],
    queryFn: () => tradeservApi.getProposals(),
  });
}

export function useCreateProposal() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.createProposal,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'proposals'] }),
  });
}

export function useUpdateProposalStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: { status: string; rejectionReason?: string } }) =>
      tradeservApi.updateProposalStatus(id, data),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'proposals'] }),
  });
}

export function useAdminProfessionalStats() {
  return useQuery({
    queryKey: ['tradeserv', 'admin', 'stats'],
    queryFn: () => tradeservApi.getAdminStats(),
  });
}

export function useAdminProfessionals(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['tradeserv', 'admin', 'professionals', params],
    queryFn: () => tradeservApi.listAdminProfessionals(params),
  });
}

export function useAdminProfessionalDetail(id: string) {
  return useQuery({
    queryKey: ['tradeserv', 'admin', 'professional', id],
    queryFn: () => tradeservApi.getAdminProfessionalDetail(id),
    enabled: !!id,
  });
}

export function useApproveProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => tradeservApi.approveProfessional(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'admin'] }),
  });
}

export function useRejectProfessional() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) => tradeservApi.rejectProfessional(id, reason),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'admin'] }),
  });
}

export function useAnalytics() {
  return useQuery({
    queryKey: ['tradeserv', 'analytics'],
    queryFn: () => tradeservApi.getAnalytics(),
  });
}

export function useSettings() {
  return useQuery({
    queryKey: ['tradeserv', 'settings'],
    queryFn: () => tradeservApi.getSettings(),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.updateSettings,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'settings'] }),
  });
}

export function useInquiries() {
  return useQuery({
    queryKey: ['tradeserv', 'inquiries'],
    queryFn: () => tradeservApi.getInquiries(),
  });
}

export function useInquiryStats() {
  return useQuery({
    queryKey: ['tradeserv', 'inquiries', 'stats'],
    queryFn: () => tradeservApi.getInquiryStats(),
  });
}

export function useInquiry(id: string) {
  return useQuery({
    queryKey: ['tradeserv', 'inquiries', id],
    queryFn: () => tradeservApi.getInquiry(id),
    enabled: !!id,
  });
}

export function useCreateInquiry() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: tradeservApi.createInquiry,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'inquiries'] }),
  });
}

export function useUpdateInquiryStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) => tradeservApi.updateInquiryStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tradeserv', 'inquiries'] }),
  });
}

export function useBooking(id: string) {
  return useQuery({
    queryKey: ['tradeserv', 'booking', id],
    queryFn: () => tradeservApi.getBooking(id),
    enabled: !!id,
  });
}

export function useAdminBookings(params?: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['tradeserv', 'admin', 'bookings', params],
    queryFn: () => tradeservApi.getAdminBookings(params),
  });
}

export function useAdminBookingStats() {
  return useQuery({
    queryKey: ['tradeserv', 'admin', 'bookings', 'stats'],
    queryFn: () => tradeservApi.getAdminBookingStats(),
  });
}

export function useTradeServSearchV2(params: Record<string, string | number | undefined>) {
  return useQuery({
    queryKey: ['tradeserv', 'search-v2', params],
    queryFn: () => tradeservApi.searchProfessionalsV2(params),
    enabled: true,
    staleTime: 30_000,
    placeholderData: (prev) => prev,
  });
}
