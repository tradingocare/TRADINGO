import { apiClient } from './client';
import type { PaginatedResponse } from './types';

export interface WalletSummary {
  id: string;
  balance: number;
  available: number;
  pending: number;
  locked: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  status: string;
  recentTransactions: LedgerEntry[];
}

export interface WalletBalance {
  balance: number;
  available: number;
  pending: number;
  locked: number;
}

export interface LedgerEntry {
  id: string;
  walletId: string;
  direction: 'CREDIT' | 'DEBIT';
  status: string;
  type: string;
  amount: number;
  balanceBefore: number;
  balanceAfter: number;
  currency: string;
  reason: string;
  referenceId: string | null;
  referenceType: string | null;
  actorId: string;
  actorType: string;
  idempotencyKey: string | null;
  createdAt: string;
}

export interface WalletStatement {
  walletId: string;
  period: string;
  from: string;
  to: string;
  openingBalance: number;
  closingBalance: number;
  totalCredits: number;
  totalDebits: number;
  transactions: LedgerEntry[];
}

export interface SellerAnalytics {
  totalTransactions: number;
  totalEarned: number;
  totalRedeemed: number;
  currentBalance: number;
  membershipRewards: { count: number; total: number };
  referralRewards: { count: number; total: number };
  campaignRewards: { count: number; total: number };
  byType: Record<string, { count: number; total: number }>;
}

export interface AdminWalletSummary {
  id: string;
  userId: string;
  companyId: string | null;
  type: string;
  balance: number;
  available: number;
  status: string;
  kycVerified: boolean;
  createdAt: string;
}

export interface AdminWalletDetail {
  id: string;
  userId: string;
  companyId: string | null;
  type: string;
  currentBalance: number;
  availableBalance: number;
  pendingBalance: number;
  lockedBalance: number;
  expiredBalance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
  lifetimeExpired: number;
  status: string;
  kycVerified: boolean;
  lockedUntil: string | null;
  createdAt: string;
  transactionCount: number;
  redemptionCount: number;
}

export interface FraudAlerts {
  alerts: string[];
  highVelocity: Array<{ walletId: string; transactionCount: number; alert: string }>;
  failedAttempts: number;
  reversedCount: number;
  totalTransactions: number;
}

export interface WalletGrowth {
  totalWallets: number;
  buyerWallets: number;
  sellerWallets: number;
  totalBalance: number;
  totalAvailable: number;
  totalLocked: number;
  totalLifetimeEarned: number;
  totalLifetimeRedeemed: number;
  activeWallets: number;
  lockedWallets: number;
  suspendedWallets: number;
  expiredWallets: number;
  newWallets30d: number;
  transactionVolume30d: number;
  transactionAmount30d: number;
}

export interface DistributionItem {
  type: string;
  count: number;
  totalAmount: number;
}

export interface TopWallet {
  rank: number;
  id: string;
  userId: string;
  type: string;
  balance: number;
  lifetimeEarned: number;
  lifetimeRedeemed: number;
}

export interface RedemptionTrend {
  totalRedemptions: number;
  totalAmount: number;
  approvedAmount: number;
  pendingAmount: number;
  byType: Record<string, { count: number; total: number }>;
}

// ─── Buyer ─────────────────────────────────────────────────

export function getBuyerWalletSummary() {
  return apiClient.get<WalletSummary>('/wallet/buyer/summary').then(r => r.data);
}

export function getBuyerBalance() {
  return apiClient.get<WalletBalance>('/wallet/buyer/balance').then(r => r.data);
}

export function getBuyerTransactions(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<LedgerEntry>>('/wallet/buyer/transactions', { params }).then(r => r.data);
}

export function getBuyerRewards(params?: { page?: number; limit?: number }) {
  return apiClient.get<PaginatedResponse<LedgerEntry>>('/wallet/buyer/rewards', { params }).then(r => r.data);
}

export function getBuyerStatement(params?: { period?: string; from?: string; to?: string }) {
  return apiClient.get<WalletStatement>('/wallet/buyer/statement', { params }).then(r => r.data);
}

// ─── Seller ────────────────────────────────────────────────

export function getSellerWalletSummary() {
  return apiClient.get<WalletSummary>('/wallet/seller/summary').then(r => r.data);
}

export function getSellerTransactions(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<LedgerEntry>>('/wallet/seller/transactions', { params }).then(r => r.data);
}

export function getSellerStatement(params?: { period?: string; from?: string; to?: string }) {
  return apiClient.get<WalletStatement>('/wallet/seller/statement', { params }).then(r => r.data);
}

export function getSellerAnalytics() {
  return apiClient.get<SellerAnalytics>('/wallet/seller/analytics').then(r => r.data);
}

// ─── Admin ─────────────────────────────────────────────────

export function searchWallets(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<AdminWalletSummary>>('/wallet/admin/wallets', { params }).then(r => r.data);
}

export function getWalletDetail(walletId: string) {
  return apiClient.get<AdminWalletDetail>(`/wallet/admin/wallets/${walletId}`).then(r => r.data);
}

export function freezeWallet(walletId: string) {
  return apiClient.post(`/wallet/admin/wallets/${walletId}/freeze`).then(r => r.data);
}

export function unfreezeWallet(walletId: string) {
  return apiClient.post(`/wallet/admin/wallets/${walletId}/unfreeze`).then(r => r.data);
}

export function manualCredit(data: { walletId: string; amount: number; reason: string; notes?: string }) {
  return apiClient.post('/wallet/admin/credit', data).then(r => r.data);
}

export function manualDebit(data: { walletId: string; amount: number; reason: string; notes?: string }) {
  return apiClient.post('/wallet/admin/debit', data).then(r => r.data);
}

export function adjustBalance(data: { walletId: string; amount: number; reason: string; notes?: string }) {
  return apiClient.post('/wallet/admin/adjust', data).then(r => r.data);
}

export function reverseTransaction(transactionId: string, reason: string) {
  return apiClient.post('/wallet/admin/reverse', { transactionId, reason }).then(r => r.data);
}

export function searchLedger(params?: Record<string, unknown>) {
  return apiClient.get<PaginatedResponse<LedgerEntry>>('/wallet/admin/ledger', { params }).then(r => r.data);
}

export function getFraudAlerts() {
  return apiClient.get<FraudAlerts>('/wallet/admin/fraud-alerts').then(r => r.data);
}

export interface FraudSummary {
  summary: {
    totalAlerts: number;
    highVelocityWallets: number;
    failedTransactions24h: number;
    reversals24h: number;
    rejectedReferrals24h: number;
    referralAuditAlerts24h: number;
    openDisputes: number;
    blacklistedEntries: number;
  };
  walletAlerts: string[];
  highVelocityWallets: Array<{ walletId: string; transactionCount: number; alert: string }>;
}

export function getFraudSummary() {
  return apiClient.get<FraudSummary>('/wallet/admin/fraud-summary').then(r => r.data);
}

export function getWalletAudit(walletId: string) {
  return apiClient.get(`/wallet/admin/wallets/${walletId}/audit`).then(r => r.data);
}

// ─── Statement ─────────────────────────────────────────────

export function generateStatement(params?: { period?: string; from?: string; to?: string }) {
  return apiClient.get<WalletStatement>('/wallet/statement', { params }).then(r => r.data);
}

// ─── Analytics ─────────────────────────────────────────────

export function getGrowthAnalytics() {
  return apiClient.get<WalletGrowth>('/wallet/analytics/growth').then(r => r.data);
}

export function getDistributionAnalytics() {
  return apiClient.get<DistributionItem[]>('/wallet/analytics/distribution').then(r => r.data);
}

export function getTopWallets(limit = 10) {
  return apiClient.get<TopWallet[]>('/wallet/analytics/top-wallets', { params: { limit } }).then(r => r.data);
}

export function getRedemptionTrends() {
  return apiClient.get<RedemptionTrend>('/wallet/analytics/redemption-trends').then(r => r.data);
}
