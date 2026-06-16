import { apiClient } from './client';
import type { Product, PaginatedResponse } from './types';
import type { ProductDetail, ProductDetailReview, ProductDetailQa } from '@/types/product-detail';

export interface GetProductsParams {
  page?: number;
  limit?: number;
  category?: string;
  status?: string;
  search?: string;
}

export function getProducts(params?: GetProductsParams) {
  return apiClient.get<PaginatedResponse<Product>>('/products', { params }).then(r => r.data);
}

export function getProduct(slug: string) {
  return apiClient.get<ProductDetail>(`/products/${slug}`).then(r => r.data);
}

export function createProduct(data: Partial<Product>) {
  return apiClient.post<Product>('/products', data).then(r => r.data);
}

export function updateProduct(id: string, data: Partial<Product>) {
  return apiClient.patch<Product>(`/products/${id}`, data).then(r => r.data);
}

export function deleteProduct(id: string) {
  return apiClient.delete(`/products/${id}`).then(r => r.data);
}

// Related Products
export function getRelatedProducts(slug: string, limit = 8) {
  return apiClient.get<ProductDetail[]>(`/products/${slug}/related?limit=${limit}`).then(r => r.data);
}

// Reviews
export function getProductReviews(slug: string, page = 1, limit = 10) {
  return apiClient.get<{ data: ProductDetailReview[]; total: number; average: number; breakdown: Record<number, number> }>(
    `/products/${slug}/reviews?page=${page}&limit=${limit}`
  ).then(r => r.data);
}

export function createProductReview(slug: string, data: { rating: number; title?: string; review?: string }) {
  return apiClient.post<ProductDetailReview>(`/products/${slug}/reviews`, data).then(r => r.data);
}

export function markReviewHelpful(slug: string, reviewId: string) {
  return apiClient.post(`/products/${slug}/reviews/${reviewId}/helpful`, {}).then(r => r.data);
}

export function getReviewStats(slug: string) {
  return apiClient.get<{ average: number; total: number; breakdown: Record<number, number> }>(`/products/${slug}/reviews/stats`).then(r => r.data);
}

// Q&A
export function getProductQuestions(slug: string, page = 1, limit = 10) {
  return apiClient.get<{ data: ProductDetailQa[]; total: number }>(`/products/${slug}/qa?page=${page}&limit=${limit}`).then(r => r.data);
}

export function askQuestion(slug: string, question: string) {
  return apiClient.post<ProductDetailQa>(`/products/${slug}/qa`, { question }).then(r => r.data);
}

export function answerQuestion(slug: string, qaId: string, answer: string) {
  return apiClient.post<ProductDetailQa>(`/products/${slug}/qa/${qaId}/answer`, { answer }).then(r => r.data);
}

// Wishlist
export function getWishlist(page = 1, limit = 20) {
  return apiClient.get<{ data: ProductDetail[]; total: number }>(`/products/wishlist?page=${page}&limit=${limit}`).then(r => r.data);
}

export function addToWishlist(productId: string, notes?: string) {
  return apiClient.post(`/products/wishlist/${productId}`, { notes }).then(r => r.data);
}

export function removeFromWishlist(productId: string) {
  return apiClient.delete(`/products/wishlist/${productId}`).then(r => r.data);
}

export function checkWishlist(productId: string) {
  return apiClient.get<{ inWishlist: boolean }>(`/products/wishlist/${productId}/check`).then(r => r.data);
}
