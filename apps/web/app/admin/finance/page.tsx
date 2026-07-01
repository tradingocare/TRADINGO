'use client';

import { useState } from 'react';
import Link from 'next/link';
import { DashboardPageHeader, StatCard, StatCardSkeleton, TableSkeleton } from '@/components/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useFinanceDashboard, useCashFlow } from '@/hooks/use-finance';
import { DollarSign, CreditCard, TrendingUp, TrendingDown, Wallet, BarChart3, FileText, Building2, Clock, Sparkles, Loader2, Shield } from 'lucide-react';
import { useAiFinanceCashFlowForecast, useAiFinanceFraudSignals } from '@/hooks/use-ai-finance';
import { toast } from '@/components/ui/use-toast';

export default function AdminFinancePage() {
  const { data: dashboard, isLoading } = useFinanceDashboard();
  const { data: cashFlow, isLoading: cfLoading } = useCashFlow();
  const aiCashFlow = useAiFinanceCashFlowForecast();
  const aiFraud = useAiFinanceFraudSignals();
  const [aiResult, setAiResult] = useState<any>(null);
  const [aiLoading, setAiLoading] = useState(false);

  return (
    <div className="space-y-6">
      <DashboardPageHeader title="Finance" description="Enterprise finance management" actions={
        <div className="flex gap-2">
          <Link href="/admin/finance/credit"><Button variant="outline"><CreditCard className="mr-2 h-4 w-4" /> Credit</Button></Link>
          <Link href="/admin/finance/collections"><Button variant="outline"><Clock className="mr-2 h-4 w-4" /> Collections</Button></Link>
          <Link href="/admin/finance/credit-notes"><Button variant="outline"><FileText className="mr-2 h-4 w-4" /> Credit/Debit Notes</Button></Link>
          <Link href="/admin/finance/reports"><Button variant="outline"><BarChart3 className="mr-2 h-4 w-4" /> Reports</Button></Link>
        </div>
      } />

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">{Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)}</div>
      ) : dashboard ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Revenue" value={`₹${dashboard.revenue.toLocaleString()}`} />
          <StatCard icon={TrendingUp} label="Receivable" value={`₹${dashboard.receivable.toLocaleString()}`} />
          <StatCard icon={TrendingDown} label="Payable" value={`₹${dashboard.payable.toLocaleString()}`} />
          <StatCard icon={Clock} label="Outstanding" value={`₹${dashboard.outstanding.toLocaleString()}`} />
        </div>
      ) : null}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>Monthly Summary</CardTitle></CardHeader>
          <CardContent>
            {isLoading ? <TableSkeleton rows={6} /> : !dashboard?.monthlySummary?.length ? <p className="text-sm text-gray-400">No data</p> : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead><tr className="border-b border-gray-700 text-left text-sm text-gray-400"><th className="p-3">Month</th><th className="p-3">Revenue</th><th className="p-3">Pending</th><th className="p-3">Refunded</th><th className="p-3">Txns</th></tr></thead>
                  <tbody>
                    {dashboard.monthlySummary.slice(-12).map((m: any) => (
                      <tr key={m.month} className="border-b border-gray-700/50">
                        <td className="p-3 text-sm">{m.month}</td>
                        <td className="p-3 text-sm text-green-400">₹{m.revenue.toLocaleString()}</td>
                        <td className="p-3 text-sm text-yellow-400">₹{m.pending.toLocaleString()}</td>
                        <td className="p-3 text-sm text-red-400">₹{m.refunded.toLocaleString()}</td>
                        <td className="p-3 text-sm">{m.transactions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Cash Flow</CardTitle></CardHeader>
          <CardContent>
            {cfLoading ? <TableSkeleton rows={3} /> : cashFlow ? (
              <div className="space-y-4">
                <div className="flex justify-between p-4 bg-green-500/10 rounded-lg"><span className="text-sm">Inflow</span><span className="text-sm font-bold text-green-400">₹{cashFlow.inflow.toLocaleString()}</span></div>
                <div className="flex justify-between p-4 bg-red-500/10 rounded-lg"><span className="text-sm">Outflow</span><span className="text-sm font-bold text-red-400">₹{cashFlow.outflow.toLocaleString()}</span></div>
                <div className="flex justify-between p-4 bg-blue-500/10 rounded-lg"><span className="text-sm">Net</span><span className={`text-sm font-bold ${cashFlow.net >= 0 ? 'text-green-400' : 'text-red-400'}`}>₹{cashFlow.net.toLocaleString()}</span></div>
                <p className="text-xs text-gray-500">Period: {new Date(cashFlow.period.start).toLocaleDateString()} - {new Date(cashFlow.period.end).toLocaleDateString()}</p>
              </div>
            ) : <p className="text-sm text-gray-400">No data</p>}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader><CardTitle className="flex items-center gap-2"><Sparkles className="h-4 w-4 text-orange-400" /> AI Finance Insights</CardTitle></CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-3">
            <Button size="sm" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try {
                const ctx = { currentInflow: cashFlow?.inflow || 0, currentOutflow: cashFlow?.outflow || 0, currentBalance: cashFlow?.net || 0, avgMonthlyRevenue: dashboard?.revenue || 0, avgMonthlyExpenses: dashboard?.payable || 0, outstandingReceivables: dashboard?.receivable || 0, forecastPeriodDays: 30 };
                const r = await aiCashFlow.mutateAsync(ctx); setAiResult(r.data); toast({ title: 'Cash flow forecast ready' });
              } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <TrendingUp className="h-4 w-4" />} Cash Flow Forecast
            </Button>
            <Button size="sm" variant="outline" disabled={aiLoading} onClick={async () => {
              setAiLoading(true); try {
                const r = await aiFraud.mutateAsync({}); setAiResult(r.data); toast({ title: 'Fraud signal scan complete' });
              } catch { toast({ title: 'Failed', variant: 'destructive' }); } finally { setAiLoading(false); }
            }}>
              {aiLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shield className="h-4 w-4" />} Fraud Signal Scan
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
