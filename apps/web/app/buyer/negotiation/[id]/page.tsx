'use client';

import { useRouter, useParams } from 'next/navigation';
import { DashboardPageHeader, StatusBadge } from '@/components/dashboard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import {
  useNegotiationDetail, useNegotiationVersions, useNegotiationTimeline,
  useCounterOffer, useAcceptNegotiation, useRejectNegotiation, useCancelNegotiation,
} from '@/hooks/use-smart-negotiation';
import { useGeneratePo } from '@/hooks/use-smart-po';
import { AiNegotiationCopilot } from '@/components/negotiation/ai-negotiation-copilot';
import {
  useAiNegotiationStrategy, useAiSellerSuggestions,
  useAiSentiment, useAiDealProbability, useAiSuggestedReplies,
  useAiRiskDetection, useAiConversationSummary, useAiNegotiationMemory,
  useAiNegotiationTimeline as useAiTimeline,
} from '@/hooks/use-ai-negotiation';
import { useState } from 'react';
import {
  ArrowLeft, DollarSign, Clock, Shield, Package, FileText, Check, X, Send, Sparkles, History, Activity, Building2, Truck, Tag, FileCheck, CheckCircle, XCircle
} from 'lucide-react';

const formatStatus = (s: string) => s.replace(/_/g, ' ').toLowerCase();

const DELIVERY_TERMS = ['EX_WORKS', 'FOB', 'CIF', 'CFR', 'CPT', 'CIP', 'DAP', 'DDP'];
const PAYMENT_TERMS_LIST = ['ADVANCE', 'COD', 'CREDIT_15', 'CREDIT_30', 'CREDIT_60', 'LC', 'ESCROW'];

export default function BuyerNegotiationDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { data: negotiation, isLoading } = useNegotiationDetail(id);
  const { data: versions } = useNegotiationVersions(id);
  const { data: timeline } = useNegotiationTimeline(id);

  const counterMutation = useCounterOffer();
  const acceptMutation = useAcceptNegotiation();
  const rejectMutation = useRejectNegotiation();
  const cancelMutation = useCancelNegotiation();

  const n: any = negotiation;
  const { toast } = useToast();

  const [showAi, setShowAi] = useState(false);
  const [aiResult, setAiResult] = useState<{ type: string; content: any } | null>(null);

  const stratMutation = useAiNegotiationStrategy();
  const sellerSuggestionsMutation = useAiSellerSuggestions();
  const sentimentMutation = useAiSentiment();
  const probabilityMutation = useAiDealProbability();
  const repliesMutation = useAiSuggestedReplies();
  const riskMutation = useAiRiskDetection();
  const summaryMutation = useAiConversationSummary();
  const memoryMutation = useAiNegotiationMemory();
  const aiTimelineMutation = useAiTimeline();

  const isAiGenerating = stratMutation.isPending || sellerSuggestionsMutation.isPending || sentimentMutation.isPending || probabilityMutation.isPending || repliesMutation.isPending || riskMutation.isPending || summaryMutation.isPending || memoryMutation.isPending || aiTimelineMutation.isPending;

  const handleAiAction = async (label: string, mutation: any, data: any) => {
    try {
      const res = await mutation.mutateAsync({ negotiationId: id, data })
      const payload = res.data || res
      setAiResult({ type: label, content: payload.content || payload })
      toast({ title: 'AI Analysis Complete', description: `${label} generated successfully`, variant: 'default' })
    } catch (err: any) {
      toast({ title: 'AI Analysis Failed', description: err?.message || 'Could not complete analysis', variant: 'destructive' })
    }
  }

  const [counterForm, setCounterForm] = useState(false);
  const [form, setForm] = useState<any>({});
  const [rejectReason, setRejectReason] = useState('');
  const [showReject, setShowReject] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const generatePoMutation = useGeneratePo();

  const canCounter = n && !['ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED', 'CONVERTED'].includes(n.status);
  const canAccept = canCounter;
  const canReject = canCounter;
  const canGeneratePo = n?.status === 'ACCEPTED';

  const handleCounter = async () => {
    setSubmitting(true);
    try {
      await counterMutation.mutateAsync({ negotiationId: id, data: form });
      setCounterForm(false);
      setForm({});
    } finally { setSubmitting(false); }
  };

  const handleAccept = async () => {
    if (!confirm('Accept the current offer? This will finalize the negotiation.')) return;
    await acceptMutation.mutateAsync(id);
  };

  const handleGeneratePo = async () => {
    try {
      const po = await generatePoMutation.mutateAsync(id);
      router.push(`/buyer/po/${po.id}`);
    } catch (e: any) {
      alert(e?.response?.data?.message || 'Failed to generate purchase order');
    }
  };

  const handleReject = async () => {
    await rejectMutation.mutateAsync({ negotiationId: id, reason: rejectReason });
    setShowReject(false);
  };

  const handleCancel = async () => {
    if (!confirm('Cancel this negotiation?')) return;
    await cancelMutation.mutateAsync({ negotiationId: id });
  };

  if (isLoading) return <div className="p-8 text-white/60">Loading...</div>;
  if (!n) return <div className="p-8 text-white/60">Negotiation not found.</div>;

  const latestVersion = Array.isArray(versions) && versions.length > 0 ? versions[versions.length - 1] : null;

  return (
    <div className="space-y-6">
      <DashboardPageHeader
        title="Negotiation Detail"
        description={`With ${n.sellerCompany?.name || 'N/A'} — ${n.rfq?.title || n.rfq?.rfqNumber || ''}`}
        actions={
          <div className="flex items-center gap-2">
            {canAccept && (
              <Button variant="accent" onClick={handleAccept} disabled={acceptMutation.isPending}>
                <Check className="mr-2 h-4 w-4" />Accept
              </Button>
            )}
            {canGeneratePo && (
              <Button variant="accent" onClick={handleGeneratePo} disabled={generatePoMutation.isPending}>
                <FileCheck className="mr-2 h-4 w-4" />{generatePoMutation.isPending ? 'Generating...' : 'Generate PO'}
              </Button>
            )}
            {canReject && (
              <Button variant="destructive" onClick={() => setShowReject(true)} disabled={rejectMutation.isPending}>
                <X className="mr-2 h-4 w-4" />Reject
              </Button>
            )}
            {canCounter && (
              <Button variant="outline" onClick={() => setCounterForm(!counterForm)}>
                <Send className="mr-2 h-4 w-4" />Counter Offer
              </Button>
            )}
            {canCounter && (
              <Button variant="ghost" onClick={handleCancel} disabled={cancelMutation.isPending}>
                Cancel
              </Button>
            )}
            <Button variant="ghost" onClick={() => setShowAi(!showAi)} className={showAi ? 'text-orange-400' : ''}>
              <Sparkles className="mr-2 h-4 w-4" />AI Copilot
            </Button>
            <Button variant="ghost" onClick={() => router.push('/buyer/negotiation')}>
              <ArrowLeft className="mr-2 h-4 w-4" />Back
            </Button>
          </div>
        }
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="space-y-4 lg:col-span-2">
          {/* Current Offer Summary */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-white/60">
                <DollarSign className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Current Offer</span>
              </div>
              <StatusBadge status={formatStatus(n.status)} />
            </div>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <p className="text-xs text-white/40">Price</p>
                <p className="text-lg font-bold text-white">
                  {n.quote?.currency || 'INR'} {n.quote?.totalAmount?.toLocaleString('en-IN') || '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Lead Time</p>
                <p className="text-sm text-white/80 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-white/40" />
                  {n.quote?.leadTimeDays ? `${n.quote.leadTimeDays}d` : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Delivery Terms</p>
                <p className="text-sm text-white/80">{n.quote?.deliveryTerms || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Payment Terms</p>
                <p className="text-sm text-white/80">{n.quote?.paymentTerms?.replace(/_/g, ' ') || '-'}</p>
              </div>
              <div>
                <p className="text-xs text-white/40">Valid Until</p>
                <p className="text-sm text-white/80">
                  {n.quote?.validityDate ? new Date(n.quote.validityDate).toLocaleDateString('en-IN') : '-'}
                </p>
              </div>
              <div>
                <p className="text-xs text-white/40">Supplier</p>
                <div className="flex items-center gap-1">
                  <Building2 className="h-3 w-3 text-white/40" />
                  <span className="text-sm text-white/80">{n.sellerCompany?.name || 'N/A'}</span>
                </div>
              </div>
            </div>
            {n.notes && (
              <div className="mt-3 rounded-lg bg-white/[0.02] p-3">
                <p className="text-xs text-white/40">Notes</p>
                <p className="text-sm text-white/70">{n.notes}</p>
              </div>
            )}
          </div>

          {/* Counter Offer Form */}
          {counterForm && (
            <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-orange-400 mb-4">
                <Send className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Counter Offer</span>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Price ({n.quote?.currency || 'INR'})</Label>
                  <Input type="number" min={0} step={0.01} value={form.proposedPrice ?? ''}
                    onChange={(e) => setForm({ ...form, proposedPrice: parseFloat(e.target.value) || 0 })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">MOQ</Label>
                  <Input type="number" min={1} value={form.proposedMoq ?? ''}
                    onChange={(e) => setForm({ ...form, proposedMoq: parseInt(e.target.value) || undefined })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Lead Time (days)</Label>
                  <Input type="number" min={1} value={form.proposedLeadTimeDays ?? ''}
                    onChange={(e) => setForm({ ...form, proposedLeadTimeDays: parseInt(e.target.value) || undefined })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Delivery Terms</Label>
                  <select value={form.proposedDeliveryTerms ?? ''}
                    onChange={(e) => setForm({ ...form, proposedDeliveryTerms: e.target.value || undefined })}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                    <option value="" className="bg-gray-900 text-white/60">No change</option>
                    {DELIVERY_TERMS.map((t) => <option key={t} value={t} className="bg-gray-900 text-white">{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Payment Terms</Label>
                  <select value={form.proposedPaymentTerms ?? ''}
                    onChange={(e) => setForm({ ...form, proposedPaymentTerms: e.target.value || undefined })}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-orange-500/50">
                    <option value="" className="bg-gray-900 text-white/60">No change</option>
                    {PAYMENT_TERMS_LIST.map((t) => <option key={t} value={t} className="bg-gray-900 text-white">{t.replace(/_/g, ' ')}</option>)}
                  </select>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Discount %</Label>
                  <Input type="number" min={0} max={100} step={0.01} value={form.proposedDiscountPercent ?? ''}
                    onChange={(e) => setForm({ ...form, proposedDiscountPercent: parseFloat(e.target.value) || undefined })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Warranty</Label>
                  <Input value={form.proposedWarranty ?? ''}
                    onChange={(e) => setForm({ ...form, proposedWarranty: e.target.value || undefined })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" placeholder="e.g. 12 months" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-white/60">Freight</Label>
                  <Input value={form.proposedFreight ?? ''}
                    onChange={(e) => setForm({ ...form, proposedFreight: e.target.value || undefined })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" placeholder="e.g. Included" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-white/60">Validity Date</Label>
                  <Input type="date" value={form.proposedValidityDate ?? ''}
                    onChange={(e) => setForm({ ...form, proposedValidityDate: e.target.value || undefined })}
                    className="bg-white/[0.04] border-white/[0.06] text-white" />
                </div>
                <div className="space-y-1 sm:col-span-2">
                  <Label className="text-xs text-white/60">Notes</Label>
                  <textarea value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                    rows={2}
                    className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-orange-500/50"
                    placeholder="Explain your counter offer..."
                  />
                </div>
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="accent" onClick={handleCounter} disabled={submitting}>
                  <Send className="mr-2 h-4 w-4" />{submitting ? 'Sending...' : 'Submit Counter'}
                </Button>
                <Button variant="ghost" onClick={() => { setCounterForm(false); setForm({}); }}>Cancel</Button>
              </div>
            </div>
          )}

          {/* Reject Dialog */}
          {showReject && (
            <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-5 backdrop-blur-xl">
              <p className="text-sm font-medium text-red-400 mb-2">Reject Negotiation</p>
              <textarea value={rejectReason} onChange={(e) => setRejectReason(e.target.value)}
                rows={2} placeholder="Reason for rejection (optional)..."
                className="w-full rounded-lg border border-white/[0.06] bg-white/[0.04] px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-red-500/50"
              />
              <div className="mt-2 flex gap-2">
                <Button variant="destructive" size="sm" onClick={handleReject}>
                  <X className="mr-1 h-3 w-3" />Confirm Reject
                </Button>
                <Button variant="ghost" size="sm" onClick={() => setShowReject(false)}>Cancel</Button>
              </div>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-4">
          {/* Version History */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <History className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Version History</span>
            </div>
            {Array.isArray(versions) && versions.length > 0 ? (
              <div className="space-y-2">
                {[...versions].reverse().map((v: any) => (
                  <div key={v.id} className="rounded-lg border border-white/[0.06] bg-white/[0.02] p-2.5">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-medium text-white">v{v.version}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded ${
                        v.proposedBy === 'BUYER' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-400'
                      }`}>{v.proposedBy}</span>
                    </div>
                    <p className="text-[10px] text-white/40 mt-1">
                      {v.createdAt ? new Date(v.createdAt).toLocaleString('en-IN') : '-'}
                    </p>
                    {Array.isArray(v.changedFields) && v.changedFields.length > 0 && (
                      <p className="text-[10px] text-white/50 mt-1">
                        Changed: {v.changedFields.map((f: string) => f.replace('proposed', '')).join(', ')}
                      </p>
                    )}
                    {v.proposedPrice && <p className="text-xs text-white/70 mt-1">₹{v.proposedPrice.toLocaleString('en-IN')}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No versions yet</p>
            )}
          </div>

          {/* Timeline */}
          <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
            <div className="flex items-center gap-2 text-white/60 mb-3">
              <Activity className="h-4 w-4" />
              <span className="text-xs font-medium uppercase tracking-wider">Timeline</span>
            </div>
            {Array.isArray(timeline) && timeline.length > 0 ? (
              <div className="space-y-2">
                {[...timeline].reverse().map((e: any) => (
                  <div key={e.id} className="flex items-start gap-2 border-l-2 border-white/[0.06] pl-3 pb-2">
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-white capitalize">{e.eventType.replace(/_/g, ' ').toLowerCase()}</p>
                      <p className="text-[10px] text-white/40">{new Date(e.createdAt).toLocaleString('en-IN')}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-white/40">No events yet</p>
            )}
          </div>

          {/* AI Copilot / Quote Details */}
          {showAi ? (
            <>
              <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
                <AiNegotiationCopilot
                  negotiationId={id}
                  negotiationData={n || {}}
                  role="BUYER"
                  onStrategy={(d) => handleAiAction('Strategy', stratMutation, d)}
                  onBuyerBehavior={(d) => handleAiAction('Buyer Insights', sellerSuggestionsMutation, d)}
                  onSellerSuggestions={(d) => handleAiAction('Seller Behaviour', sellerSuggestionsMutation, d)}
                  onSentiment={(d) => handleAiAction('Sentiment', sentimentMutation, d)}
                  onDealProbability={(d) => handleAiAction('Deal Probability', probabilityMutation, d)}
                  onReplies={(d) => handleAiAction('Suggested Replies', repliesMutation, d)}
                  onRisk={(d) => handleAiAction('Risk Detection', riskMutation, d)}
                  onSummary={(d) => handleAiAction('Summary', summaryMutation, d)}
                  onMemory={(d) => handleAiAction('AI Memory', memoryMutation, d)}
                  onTimeline={(d) => handleAiAction('Timeline', aiTimelineMutation, d)}
                  isGenerating={isAiGenerating}
                />
              </div>

              {aiResult && (
                <div className="rounded-xl border border-orange-500/20 bg-orange-500/5 p-4 backdrop-blur-xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2 text-xs font-semibold text-orange-300">
                      <CheckCircle className="h-3 w-3" />
                      {aiResult.type}
                    </div>
                    <button onClick={() => setAiResult(null)} className="text-white/30 hover:text-white/60">
                      <XCircle className="h-3 w-3" />
                    </button>
                  </div>
                  <pre className="text-xs text-white/70 whitespace-pre-wrap font-sans leading-relaxed max-h-60 overflow-y-auto">
                    {typeof aiResult.content === 'object' ? JSON.stringify(aiResult.content, null, 2) : String(aiResult.content)}
                  </pre>
                </div>
              )}

              {isAiGenerating && (
                <div className="rounded-xl border border-white/[0.06] bg-white/[0.02] p-4 backdrop-blur-xl">
                  <div className="flex items-center gap-2 text-sm text-white/50">
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-400 border-t-transparent" />
                    AI is analysing...
                  </div>
                </div>
              )}
            </>
          ) : (
            <div className="rounded-xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-xl">
              <div className="flex items-center gap-2 text-white/60 mb-3">
                <FileText className="h-4 w-4" />
                <span className="text-xs font-medium uppercase tracking-wider">Quote Details</span>
              </div>
              {n.quote && (
                <dl className="space-y-2 text-xs">
                  <div className="flex justify-between">
                    <dt className="text-white/40">Line Items</dt>
                    <dd className="text-white">{n.quote.lineItems?.length || 0}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/40">Total</dt>
                    <dd className="text-white font-medium">{n.quote.currency} {n.quote.totalAmount?.toLocaleString('en-IN')}</dd>
                  </div>
                  <div className="flex justify-between">
                    <dt className="text-white/40">Tax</dt>
                    <dd className="text-white">{n.quote.taxAmount?.toLocaleString('en-IN') || '-'}</dd>
                  </div>
                </dl>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
