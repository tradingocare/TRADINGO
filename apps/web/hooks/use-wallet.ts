import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import * as walletApi from '@/lib/api/wallet';

// ─── Buyer ─────────────────────────────────────────────────

export function useBuyerWalletSummary() {
  return useQuery({ queryKey: ['wallet', 'buyer', 'summary'], queryFn: walletApi.getBuyerWalletSummary });
}

export function useBuyerBalance() {
  return useQuery({ queryKey: ['wallet', 'buyer', 'balance'], queryFn: walletApi.getBuyerBalance });
}

export function useBuyerTransactions(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['wallet', 'buyer', 'transactions', params], queryFn: () => walletApi.getBuyerTransactions(params) });
}

export function useBuyerRewards(params?: { page?: number; limit?: number }) {
  return useQuery({ queryKey: ['wallet', 'buyer', 'rewards', params], queryFn: () => walletApi.getBuyerRewards(params) });
}

export function useBuyerStatement(params?: { period?: string; from?: string; to?: string }) {
  return useQuery({ queryKey: ['wallet', 'buyer', 'statement', params], queryFn: () => walletApi.getBuyerStatement(params) });
}

// ─── Seller ────────────────────────────────────────────────

export function useSellerWalletSummary() {
  return useQuery({ queryKey: ['wallet', 'seller', 'summary'], queryFn: walletApi.getSellerWalletSummary });
}

export function useSellerTransactions(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['wallet', 'seller', 'transactions', params], queryFn: () => walletApi.getSellerTransactions(params) });
}

export function useSellerAnalytics() {
  return useQuery({ queryKey: ['wallet', 'seller', 'analytics'], queryFn: walletApi.getSellerAnalytics });
}

export function useSellerStatement(params?: { period?: string; from?: string; to?: string }) {
  return useQuery({ queryKey: ['wallet', 'seller', 'statement', params], queryFn: () => walletApi.getSellerStatement(params) });
}

// ─── Admin ─────────────────────────────────────────────────

export function useSearchWallets(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['wallet', 'admin', 'search', params], queryFn: () => walletApi.searchWallets(params) });
}

export function useWalletDetail(walletId: string) {
  return useQuery({ queryKey: ['wallet', 'admin', 'detail', walletId], queryFn: () => walletApi.getWalletDetail(walletId), enabled: !!walletId });
}

export function useFreezeWallet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: walletApi.freezeWallet, onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet', 'admin'] }) });
}

export function useUnfreezeWallet() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: walletApi.unfreezeWallet, onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet', 'admin'] }) });
}

export function useManualCredit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: walletApi.manualCredit, onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }) });
}

export function useManualDebit() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: walletApi.manualDebit, onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }) });
}

export function useAdjustBalance() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: walletApi.adjustBalance, onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }) });
}

export function useReverseTransaction() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: ({ transactionId, reason }: { transactionId: string; reason: string }) => walletApi.reverseTransaction(transactionId, reason), onSuccess: () => qc.invalidateQueries({ queryKey: ['wallet'] }) });
}

export function useSearchLedger(params?: Record<string, unknown>) {
  return useQuery({ queryKey: ['wallet', 'admin', 'ledger', params], queryFn: () => walletApi.searchLedger(params) });
}

export function useFraudAlerts() {
  return useQuery({ queryKey: ['wallet', 'admin', 'fraud'], queryFn: walletApi.getFraudAlerts });
}

export function useFraudSummary() {
  return useQuery({ queryKey: ['wallet', 'admin', 'fraud-summary'], queryFn: walletApi.getFraudSummary });
}

export function useWalletAudit(walletId: string) {
  return useQuery({ queryKey: ['wallet', 'admin', 'audit', walletId], queryFn: () => walletApi.getWalletAudit(walletId), enabled: !!walletId });
}

// ─── Statement ─────────────────────────────────────────────

export function useStatement(params?: { period?: string; from?: string; to?: string }) {
  return useQuery({ queryKey: ['wallet', 'statement', params], queryFn: () => walletApi.generateStatement(params) });
}

// ─── Analytics ─────────────────────────────────────────────

export function useGrowthAnalytics() {
  return useQuery({ queryKey: ['wallet', 'analytics', 'growth'], queryFn: walletApi.getGrowthAnalytics });
}

export function useDistributionAnalytics() {
  return useQuery({ queryKey: ['wallet', 'analytics', 'distribution'], queryFn: walletApi.getDistributionAnalytics });
}

export function useTopWallets(limit = 10) {
  return useQuery({ queryKey: ['wallet', 'analytics', 'top', limit], queryFn: () => walletApi.getTopWallets(limit) });
}

export function useRedemptionTrends() {
  return useQuery({ queryKey: ['wallet', 'analytics', 'redemptions'], queryFn: walletApi.getRedemptionTrends });
}
