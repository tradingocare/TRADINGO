'use client';

import { useState } from 'react';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCredits, useCreditUtilization, useSetCreditLimit, useUpdateCreditStatus, useUpdateRiskLevel, useAllCreditApprovals, useApproveCreditApproval, useRejectCreditApproval } from '@/hooks/use-finance';
import { toast } from '@/components/ui/use-toast';
import { CreditCard, DollarSign, Shield, AlertTriangle, CheckCircle, XCircle, Sparkles, Loader2, TrendingUp, BarChart3 } from 'lucide-react';
import { useAiFinanceCreditRisk, useAiFinanceFinancialHealth, useAiFinanceCreditLimit } from '@/hooks/use-ai-finance';

const STATUS_STYLES: Record<string, string> = { ACTIVE: 'bg-green-500/20 text-green-400', SUSPENDED: 'bg-yellow-500/20 text-yellow-400', BLOCKED: 'bg-red-500/20 text-red-400', CLOSED: 'bg-gray-500/20 text-gray-400' };
const RISK_STYLES: Record<string, string> = { LOW: 'bg-green-500/20 text-green-400', MEDIUM: 'bg-yellow-500/20 text-yellow-400', HIGH: 'bg-orange-500/20 text-orange-400', CRITICAL: 'bg-red-500/20 text-red-400' };

export default function AdminCreditPage() {
  const { data: creditsData, isLoading } = useCredits({ page: 1, limit: 50 });
  const { data: utilization } = useCreditUtilization();
  const { data: approvals } = useAllCreditApprovals({ page: 1, limit: 20 });
  const setLimitMutation = useSetCreditLimit();
  const updateStatusMutation = useUpdateCreditStatus();
  const updateRiskMutation = useUpdateRiskLevel();
  const approveMutation = useApproveCreditApproval();
  const rejectMutation = useRejectCreditApproval();
  const [limitForm, setLimitForm] = useState({ companyId: '', creditLimit: 0, notes: '' });
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const aiCreditRisk = useAiFinanceCreditRisk();
  const aiFinancialHealth = useAiFinanceFinancialHealth();
  const aiCreditLimitRec = useAiFinanceCreditLimit();

  const handleSetLimit = async (e: React.FormEvent) => {
    e.preventDefault();
    try { await setLimitMutation.mutateAsync({ companyId: limitForm.companyId, dto: { creditLimit: limitForm.creditLimit, notes: limitForm.notes } }); toast({ title: 'Credit limit updated' }); setLimitForm({ companyId: '', creditLimit: 0, notes: '' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); }
  };

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Credit Management" description="Buyer credit limits, risk levels, and approvals" />

      {utilization ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <StatCard icon={DollarSign} label="Total Credit Limit" value={`₹${utilization.totalLimit.toLocaleString()}`} />
          <StatCard icon={CreditCard} label="Total Used" value={`₹${utilization.totalUsed.toLocaleString()}`} />
          <StatCard icon={Shield} label="Utilization Rate" value={`${utilization.utilizationRate}%`} />
        </div>
      ) : <div className="grid grid-cols-1 md:grid-cols-3 gap-4">{Array.from({ length: 3 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Set Credit Limit</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={handleSetLimit} className="space-y-3">
              <div><Label>Company ID</Label><Input required placeholder="company-id" value={limitForm.companyId} onChange={e => setLimitForm(p => ({ ...p, companyId: e.target.value }))} /></div>
              <div><Label>Credit Limit (INR)</Label><Input required type="number" min={0} value={limitForm.creditLimit || ''} onChange={e => setLimitForm(p => ({ ...p, creditLimit: Number(e.target.value) }))} /></div>
              <div><Label>Notes</Label><Input value={limitForm.notes} onChange={e => setLimitForm(p => ({ ...p, notes: e.target.value }))} /></div>
              <Button type="submit" disabled={setLimitMutation.isPending}>Set Limit</Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Pending Approvals ({approvals?.data?.length || 0})</CardTitle></CardHeader>
          <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
            {!approvals?.data?.length ? <p className="text-sm text-gray-400">No pending approvals</p> : approvals.data.map((a: any) => (
              <div key={a.id} className="p-3 bg-gray-800/50 rounded-lg">
                <div className="flex justify-between items-start">
                  <div><p className="text-sm font-medium">{a.requestType}</p><p className="text-xs text-gray-400">{a.buyerCredit?.company?.name || a.buyerCreditId} • {a.reason}</p></div>
                  <Badge className={a.status === 'PENDING' ? 'bg-yellow-500/20 text-yellow-400' : ''}>{a.status}</Badge>
                </div>
                {a.status === 'PENDING' && (
                  <div className="flex gap-2 mt-2">
                    <Button size="sm" onClick={async () => { try { await approveMutation.mutateAsync({ id: a.id }); toast({ title: 'Approved' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } }}><CheckCircle className="mr-1 h-3 w-3" /> Approve</Button>
                    <Button size="sm" variant="outline" onClick={async () => { const r = prompt('Rejection reason:'); if (r) { try { await rejectMutation.mutateAsync({ id: a.id, reason: r }); toast({ title: 'Rejected' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } } }}><XCircle className="mr-1 h-3 w-3" /> Reject</Button>
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle>All Buyer Credits ({creditsData?.meta?.total || 0})</CardTitle></CardHeader>
        <CardContent className="p-0">
          {isLoading ? <TableSkeleton rows={5} /> : !creditsData?.data?.length ? <div className="p-8 text-center text-gray-400">No credit records</div> : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead><tr className="border-b border-gray-700 text-left text-sm text-gray-400"><th className="p-3">Company</th><th className="p-3">Limit</th><th className="p-3">Used</th><th className="p-3">Available</th><th className="p-3">Util%</th><th className="p-3">Status</th><th className="p-3">Risk</th><th className="p-3"></th></tr></thead>
                <tbody>
                  {creditsData.data.map((c: any) => {
                    const limit = Number(c.creditLimit);
                    const used = Number(c.usedCredit);
                    const utilPct = limit > 0 ? (used / limit * 100).toFixed(1) : '0';
                    return (
                      <tr key={c.id} className="border-b border-gray-700/50">
                        <td className="p-3 text-sm">{c.company?.name || c.companyId}</td>
                        <td className="p-3 text-sm">₹{limit.toLocaleString()}</td>
                        <td className="p-3 text-sm">₹{used.toLocaleString()}</td>
                        <td className="p-3 text-sm">₹{Number(c.availableCredit).toLocaleString()}</td>
                        <td className="p-3 text-sm">{utilPct}%</td>
                        <td className="p-3"><Badge className={STATUS_STYLES[c.status] || ''}>{c.status}</Badge></td>
                        <td className="p-3"><Badge className={RISK_STYLES[c.riskLevel] || ''}>{c.riskLevel}</Badge></td>
                        <td className="p-3">
                          <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs" onChange={async e => { if (!e.target.value) return; try { await updateStatusMutation.mutateAsync({ companyId: c.companyId, dto: { status: e.target.value } }); toast({ title: 'Status updated' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } }}>
                            <option value="">Status</option>
                            {['ACTIVE', 'SUSPENDED', 'BLOCKED', 'CLOSED'].filter(s => s !== c.status).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                          <select className="bg-gray-800 border border-gray-700 rounded px-2 py-1 text-xs ml-1" onChange={async e => { if (!e.target.value) return; try { await updateRiskMutation.mutateAsync({ companyId: c.companyId, dto: { riskLevel: e.target.value } }); toast({ title: 'Risk level updated' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } }}>
                            <option value="">Risk</option>
                            {['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'].filter(r => r !== c.riskLevel).map(r => <option key={r} value={r}>{r}</option>)}
                          </select>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-400" /> AI Credit Intelligence</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try { const r = await aiCreditRisk.mutateAsync({}); setAiResult(r.data); toast({ title: 'Credit risk assessment ready' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Credit Risk Assessment
            </Button>
            <Button size="sm" variant="outline" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try { const r = await aiFinancialHealth.mutateAsync({}); setAiResult(r.data); toast({ title: 'Financial health assessment ready' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <BarChart3 className="h-4 w-4" />} Financial Health
            </Button>
            <Button size="sm" variant="outline" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try { const r = await aiCreditLimitRec.mutateAsync({}); setAiResult(r.data); toast({ title: 'Credit limit recommendation ready' }); } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} Credit Limit Rec.
            </Button>
          </div>
          {aiResult && (
            <pre className="mt-4 p-3 bg-gray-800/50 rounded-lg text-xs text-gray-300 whitespace-pre-wrap overflow-auto max-h-60">{JSON.stringify(aiResult, null, 2)}</pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
