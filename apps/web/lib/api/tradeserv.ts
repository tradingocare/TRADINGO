import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface ProfessionalSummary {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  professionalType: string | null;
  description: string | null;
  trustScore: number;
  verificationLevel: string;
  responseTimeMinutes: number | null;
  lastActiveAt: string | null;
  videoIntroductionUrl: string | null;
  socialLinks: Record<string, string> | null;
  serviceCount: number;
  portfolioCount: number;
  reviewCount: number;
  averageRating: number;
  locations: string[];
  languages: string[];
  professionalStatus: string | null;
  _count?: { professionalServices: number; professionalPortfolio: number; reviewsAsProfessional: number };
}

export interface ProfessionalFull extends ProfessionalSummary {
  banner: string | null;
  website: string | null;
  email: string | null;
  mobile: string | null;
  businessType: string | null;
  establishedYear: number | null;
  employeeCount: number | null;
  professionalServices: ProfessionalService[];
  professionalPortfolio: ProfessionalPortfolio[];
  professionalCertifications: ProfessionalCertification[];
  professionalAvailability: ProfessionalAvailability[];
  professionalLanguages: { id: string; language: string; proficiency: string | null }[];
  professionalServiceAreas: { id: string; city: string; state: string | null; country: string; serviceType: string | null }[];
  qualifications?: { title: string; year: string; institution: string }[];
  reviewsAsProfessional?: ProfessionalReview[];
}

export interface ProfessionalService {
  id: string;
  companyId: string;
  name: string;
  description: string | null;
  category: string | null;
  priceMin: number | null;
  priceMax: number | null;
  pricingType: string | null;
  deliveryDays: number | null;
  isActive: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalPortfolio {
  id: string;
  companyId: string;
  title: string;
  description: string | null;
  clientName: string | null;
  completionDate: string | null;
  media: Record<string, unknown> | null;
  tags: string[];
  isFeatured: boolean;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalCertification {
  id: string;
  companyId: string;
  name: string;
  issuingAuthority: string;
  issueDate: string;
  expiryDate: string | null;
  certificateUrl: string | null;
  verificationStatus: string;
  verifiedAt: string | null;
  verifiedBy: string | null;
}

export interface ProfessionalAvailability {
  id: string;
  companyId: string;
  dayOfWeek: number;
  startTime: string;
  endTime: string;
  isAvailable: boolean;
}

export interface Booking {
  id: string;
  companyId: string;
  clientId: string;
  serviceId: string | null;
  status: string;
  scheduledAt: string;
  durationMinutes: number | null;
  amount: number | null;
  paymentId: string | null;
  paymentStatus: string;
  notes: string | null;
  meetingLink: string | null;
  location: string | null;
  completedAt: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  createdAt: string;
  updatedAt: string;
  service?: ProfessionalService | null;
  company?: { id: string; name: string; slug: string; logo: string | null; email?: string; mobile?: string } | null;
}

export interface BookingDetail extends Booking {
  client: { id: string; name: string; slug: string; logo: string | null; email?: string; mobile?: string } | null;
  reviews: ProfessionalReview[];
}

export interface BookingStats {
  total: number;
  pending: number;
  confirmed: number;
  inProgress: number;
  completed: number;
  cancelled: number;
}

export interface Proposal {
  id: string;
  companyId: string;
  clientId: string;
  inquiryId: string | null;
  title: string;
  description: string | null;
  amount: number | null;
  deliveryDays: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
}

export interface ProfessionalReview {
  id: string;
  bookingId: string;
  companyId: string;
  clientId: string;
  rating: number;
  title: string | null;
  description: string | null;
  isVerifiedBooking: boolean;
  rehired: boolean;
  createdAt: string;
  client?: { name: string; slug: string; logo: string | null };
}

export interface EnrichedCategory {
  category: string;
  _count: number;
  catalogCategory: { id: string; name: string; type: string } | null;
}

export interface ResolvedCategory {
  query: string;
  resolved: { id: string; name: string; type: string; parentName?: string }[];
  matchedCount: number;
}

export interface EnrichedService extends ProfessionalService {
  catalogCategory: { id: string; name: string; type: string } | null;
}

export interface DashboardStats {
  services: number;
  portfolio: number;
  bookings: number;
  reviews: number;
  proposals: number;
}

export interface AdminStats {
  total: number;
  pending: number;
  approved: number;
  rejected: number;
  services: number;
  bookings: number;
  reviews: number;
}

export interface TradeservSearchV2Response {
  data: Record<string, unknown>[];
  meta: { total: number; page: number; limit: number; totalPages: number; hasNext: boolean; hasPrevious: boolean };
  aggregations: {
    categories: { key: string; doc_count: number }[];
    cities: { key: string; doc_count: number }[];
    states: { key: string; doc_count: number }[];
    verificationLevels: { key: string; doc_count: number }[];
    ratingRanges: { key: string; from?: number; to?: number; doc_count: number }[];
    professionalTypes: { key: string; doc_count: number }[];
  };
}

export const tradeservApi = {
  getProfessional: (slug: string) =>
    apiClient.get<ProfessionalFull>(`/tradeserv/professionals/${slug}`).then(r => r.data),

  getProfessionalSummary: (slug: string) =>
    apiClient.get<ProfessionalSummary>(`/tradeserv/professionals/${slug}/summary`).then(r => r.data),

  searchProfessionals: (params: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<ProfessionalSummary>>('/tradeserv/search', { params }).then(r => r.data),

  getFeatured: (limit = 10) =>
    apiClient.get<ProfessionalSummary[]>('/tradeserv/featured', { params: { limit } }).then(r => r.data),

  getCategories: () =>
    apiClient.get<{ category: string; _count: number }[]>('/tradeserv/categories').then(r => r.data),

  getEnrichedCategories: () =>
    apiClient.get<EnrichedCategory[]>('/tradeserv/categories/enriched').then(r => r.data),

  resolveCategory: (name: string) =>
    apiClient.get<ResolvedCategory>(`/tradeserv/categories/resolve/${encodeURIComponent(name)}`).then(r => r.data),

  getEnrichedService: (id: string) =>
    apiClient.get<EnrichedService>(`/tradeserv/services/${id}/enriched`).then(r => r.data),

  register: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/register', data).then(r => r.data),

  getMyProfile: () =>
    apiClient.get('/tradeserv/profile').then(r => r.data),

  updateProfile: (data: Record<string, unknown>) =>
    apiClient.patch('/tradeserv/profile', data).then(r => r.data),

  getDashboard: () =>
    apiClient.get<DashboardStats>('/tradeserv/dashboard').then(r => r.data),

  getServices: () =>
    apiClient.get<ProfessionalService[]>('/tradeserv/services').then(r => r.data),

  addService: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/services', data).then(r => r.data),

  updateService: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/tradeserv/services/${id}`, data).then(r => r.data),

  deleteService: (id: string) =>
    apiClient.delete(`/tradeserv/services/${id}`).then(r => r.data),

  getPortfolio: () =>
    apiClient.get<ProfessionalPortfolio[]>('/tradeserv/portfolio').then(r => r.data),

  addPortfolioItem: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/portfolio', data).then(r => r.data),

  updatePortfolioItem: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/tradeserv/portfolio/${id}`, data).then(r => r.data),

  deletePortfolioItem: (id: string) =>
    apiClient.delete(`/tradeserv/portfolio/${id}`).then(r => r.data),

  getCertifications: () =>
    apiClient.get<ProfessionalCertification[]>('/tradeserv/certifications').then(r => r.data),

  addCertification: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/certifications', data).then(r => r.data),

  updateCertification: (id: string, data: Record<string, unknown>) =>
    apiClient.patch(`/tradeserv/certifications/${id}`, data).then(r => r.data),

  deleteCertification: (id: string) =>
    apiClient.delete(`/tradeserv/certifications/${id}`).then(r => r.data),

  setAvailability: (data: { dayOfWeek: number; startTime: string; endTime: string; isAvailable?: boolean }) =>
    apiClient.post('/tradeserv/availability', data).then(r => r.data),

  getAvailability: () =>
    apiClient.get<ProfessionalAvailability[]>('/tradeserv/availability').then(r => r.data),

  addLanguage: (data: { language: string; proficiency?: string }) =>
    apiClient.post('/tradeserv/languages', data).then(r => r.data),

  removeLanguage: (language: string) =>
    apiClient.delete(`/tradeserv/languages/${encodeURIComponent(language)}`).then(r => r.data),

  addServiceArea: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/service-areas', data).then(r => r.data),

  removeServiceArea: (id: string) =>
    apiClient.delete(`/tradeserv/service-areas/${id}`).then(r => r.data),

  getBookings: (params?: { page?: number; limit?: number; status?: string }) =>
    apiClient.get<{ asProfessional: Booking[]; asClient: Booking[]; meta: Record<string, unknown> }>('/tradeserv/bookings', { params }).then(r => r.data),

  getBooking: (id: string) =>
    apiClient.get<BookingDetail>(`/tradeserv/bookings/${id}`).then(r => r.data),

  createBooking: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/bookings', data).then(r => r.data),

  updateBookingStatus: (id: string, data: { status: string; cancelReason?: string; meetingLink?: string }) =>
    apiClient.patch(`/tradeserv/bookings/${id}/status`, data).then(r => r.data),

  createReview: (data: { bookingId: string; rating: number; title?: string; description?: string; rehired?: boolean }) =>
    apiClient.post('/tradeserv/bookings/reviews', data).then(r => r.data),

  getReviews: (companyId: string) =>
    apiClient.get<ProfessionalReview[]>(`/tradeserv/bookings/reviews/${companyId}`).then(r => r.data),

  getProposals: () =>
    apiClient.get<{ asProfessional: Proposal[]; asClient: Proposal[] }>('/tradeserv/proposals').then(r => r.data),

  createProposal: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/proposals', data).then(r => r.data),

  updateProposalStatus: (id: string, data: { status: string; rejectionReason?: string }) =>
    apiClient.patch(`/tradeserv/proposals/${id}/status`, data).then(r => r.data),

  searchProfessionalsV2: (params: Record<string, string | number | undefined>) =>
    apiClient.get<TradeservSearchV2Response>('/tradeserv/search/v2', { params }).then(r => r.data),

  getAdminStats: () =>
    apiClient.get<AdminStats>('/admin/tradeserv/stats').then(r => r.data),

  listAdminProfessionals: (params: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<ProfessionalSummary>>('/admin/tradeserv/professionals', { params }).then(r => r.data),

  getAdminProfessionalDetail: (id: string) =>
    apiClient.get(`/admin/tradeserv/professionals/${id}`).then(r => r.data),

  approveProfessional: (id: string, reason?: string) =>
    apiClient.post(`/admin/tradeserv/professionals/${id}/approve`, { reason }).then(r => r.data),

  rejectProfessional: (id: string, reason?: string) =>
    apiClient.post(`/admin/tradeserv/professionals/${id}/reject`, { reason }).then(r => r.data),

  getAnalytics: () =>
    apiClient.get<{ overview: { reviews: number; inquiries: number; bookings: number; trustScore: number }; monthlyTrends: { month: string; bookings: number }[] }>('/tradeserv/analytics').then(r => r.data),

  getSettings: () =>
    apiClient.get<{ notifications: Record<string, boolean>; privacy: Record<string, boolean>; visibility: Record<string, boolean>; communication: Record<string, boolean>; profile: Record<string, unknown> }>('/tradeserv/settings').then(r => r.data),

  updateSettings: (data: Record<string, unknown>) =>
    apiClient.patch('/tradeserv/settings', data).then(r => r.data),

  getInquiries: () =>
    apiClient.get<{ id: string; companyId: string; clientName: string; clientCompany: string | null; email: string; phone: string | null; requirement: string; budget: string | null; timeline: string | null; status: string; notes: string | null; createdAt: string }[]>('/tradeserv/inquiries').then(r => r.data),

  getInquiryStats: () =>
    apiClient.get<{ total: number; accepted: number; rejected: number; closed: number; pending: number }>('/tradeserv/inquiries/stats').then(r => r.data),

  getInquiry: (id: string) =>
    apiClient.get(`/tradeserv/inquiries/${id}`).then(r => r.data),

  createInquiry: (data: Record<string, unknown>) =>
    apiClient.post('/tradeserv/inquiries', data).then(r => r.data),

  updateInquiryStatus: (id: string, status: string) =>
    apiClient.patch(`/tradeserv/inquiries/${id}/status`, { status }).then(r => r.data),

  getAdminBookings: (params?: Record<string, string | number | undefined>) =>
    apiClient.get<PaginatedResponse<Booking>>('/admin/tradeserv/bookings', { params }).then(r => r.data),

  getAdminBookingStats: () =>
    apiClient.get<BookingStats>('/admin/tradeserv/bookings/stats').then(r => r.data),
};
