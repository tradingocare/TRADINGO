'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import api from '@/lib/api/client'
import { Loader2, Download, Printer, ChevronLeft, FileText, CheckCircle, XCircle, Mail } from 'lucide-react'
import { toast } from '@/components/ui/use-toast'

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  GENERATED: { label: 'Generated', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText },
  SENT: { label: 'Sent', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Mail },
  VOID: { label: 'Void', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-surface text-text-secondary border-border', icon: XCircle },
}

interface InvoiceDetail {
  id: string; invoiceNumber: string; status: string; planId: string; planName: string; planTier: string
  subtotal: string; totalAmount: string; taxAmount: string; currency: string
  gstType: string | null; cgstAmount: string | null; sgstAmount: string | null; igstAmount: string | null
  hsnSacCode: string | null; issuedAt: string; paidAt: string | null; voidAt: string | null
  voidReason: string | null
  company: { name: string; email: string; gstNumber: string | null; panNumber: string | null; locations: Array<{ addressLine1: string | null; city: string | null; state: string | null; pincode: string | null }> | null }
  payment: { gateway: string; gatewayPaymentId: string; amount: string; status: string }
  items: any[]
  taxBreakdown: any[]
}

export default function InvoiceDetailPage() {
  const { invoiceId } = useParams()
  const router = useRouter()
  const [inv, setInv] = useState<InvoiceDetail | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!invoiceId) return
    api.get(`/billing/invoices/${invoiceId}`)
      .then(res => setInv(res.data?.data || res.data))
      .catch((err: any) => { console.error('Failed to load invoice:', err); toast.error('Failed to load invoice') })
      .finally(() => setLoading(false))
  }, [invoiceId])

  const handlePdf = async () => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {
      toast({ title: 'Error', description: 'Failed to download PDF', variant: 'destructive' })
    }
  }

  const formatAmount = (n?: string | number | null) => {
    if (!n) return '₹0.00'
    return '₹' + Number(n).toLocaleString('en-IN', { minimumFractionDigits: 2 })
  }
  const formatDate = (d?: string | null) => d ? new Date(d).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '—'
  const formatDateTime = (d?: string | null) =>
  d
    ? new Date(d).toLocaleString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '—'

  if (loading) return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-accent" />
    </div>
  )

  if (!inv) return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <p className="text-sm text-text-tertiary">Invoice not found</p>
    </div>
  )

  const StatusIcon = STATUS_MAP[inv.status]?.icon || FileText

  return (
    <div className="min-h-screen bg-bg-base">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-bg-elevated transition-all">
            <ChevronLeft size={18} className="text-text-secondary" />
          </button>
          <h1 className="text-2xl font-black text-text-primary">Invoice Details</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold border ${STATUS_MAP[inv.status]?.color || 'border-border text-text-secondary'}`}>
                    <StatusIcon size={14} />
                    {STATUS_MAP[inv.status]?.label || inv.status}
                  </div>
                  <span className="text-xs text-text-tertiary">Issued {formatDate(inv.issuedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePdf}
                    className="px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-elevated flex items-center gap-1.5 transition-all">
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={() => window.print()}
                    className="px-3 py-2 rounded-lg border border-border text-xs font-semibold text-text-secondary hover:bg-bg-elevated flex items-center gap-1.5 transition-all">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-border">
                <div>
                  <h2 className="text-xl font-black text-text-primary">{inv.invoiceNumber}</h2>
                  <p className="text-sm text-text-secondary">{inv.planName || inv.planId} ({inv.planTier})</p>
                </div>
                <p className="text-2xl font-black text-text-primary">{formatAmount(inv.totalAmount)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-2">Seller</h3>
                  <p className="text-sm font-bold text-text-primary">{inv.company?.name || '—'}</p>
                  {inv.company?.email && <p className="text-xs text-text-secondary">{inv.company.email}</p>}
                  {inv.company?.gstNumber && <p className="text-xs text-text-secondary">GST: {inv.company.gstNumber}</p>}
                  {inv.company?.panNumber && <p className="text-xs text-text-secondary">PAN: {inv.company.panNumber}</p>}
                </div>
                <div className="text-right">
                  {inv.company?.locations?.[0]?.addressLine1 && (
                    <>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-2">Address</h3>
                      <p className="text-xs text-text-secondary">{inv.company.locations[0].addressLine1}</p>
                      <p className="text-xs text-text-secondary">
                        {[inv.company.locations[0].city, inv.company.locations[0].state, inv.company.locations[0].pincode].filter(Boolean).join(', ')}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {inv.gstType && (
                <div className="bg-surface rounded-xl p-4 border border-border">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-3">GST Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-text-tertiary">GST Type</p>
                      <p className="text-sm font-bold text-text-primary">{inv.gstType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-text-tertiary">{inv.gstType === 'IGST' ? 'IGST Amount' : 'CGST Amount'}</p>
                      <p className="text-sm font-bold text-text-primary">{formatAmount(inv.gstType === 'IGST' ? inv.igstAmount : inv.cgstAmount)}</p>
                    </div>
                    {inv.gstType !== 'IGST' && (
                      <div>
                        <p className="text-[10px] text-text-tertiary">SGST Amount</p>
                        <p className="text-sm font-bold text-text-primary">{formatAmount(inv.sgstAmount)}</p>
                      </div>
                    )}
                  </div>
                  {inv.hsnSacCode && <p className="text-[10px] text-text-tertiary mt-2">HSN/SAC: {inv.hsnSacCode}</p>}
                </div>
              )}

              {inv.items && inv.items.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-2">Items</h3>
                  <div className="divide-y divide-border">
                    {inv.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-semibold text-text-primary">{item.description || item.name}</p>
                          {item.quantity && <p className="text-xs text-text-tertiary">Qty: {item.quantity}</p>}
                        </div>
                        <p className="text-sm font-bold text-text-primary">{formatAmount(item.amount || item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-border">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">Subtotal</span>
                  <span className="text-xs text-text-primary">{formatAmount(inv.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-text-secondary">Tax</span>
                  <span className="text-xs text-text-primary">{formatAmount(inv.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-border">
                  <span className="text-sm font-bold text-text-primary">Total</span>
                  <span className="text-lg font-black text-text-primary">{formatAmount(inv.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-3">Payment Info</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-text-tertiary">Gateway</p>
                  <p className="text-xs font-semibold text-text-primary">{inv.payment?.gateway || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Payment ID</p>
                  <p className="text-xs text-text-primary break-all">{inv.payment?.gatewayPaymentId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Amount Paid</p>
                  <p className="text-xs font-semibold text-text-primary">{formatAmount(inv.payment?.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-text-tertiary">Paid At</p>
                  <p className="text-xs text-text-primary">{formatDateTime(inv.paidAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-surface rounded-2xl border border-border shadow-sm p-5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-text-tertiary mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-text-primary">Issued</p>
                    <p className="text-[10px] text-text-tertiary">{formatDateTime(inv.issuedAt)}</p>
                  </div>
                </div>
                {inv.paidAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Paid</p>
                      <p className="text-[10px] text-text-tertiary">{formatDateTime(inv.paidAt)}</p>
                    </div>
                  </div>
                )}
                {inv.voidAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-text-primary">Voided</p>
                      <p className="text-[10px] text-text-tertiary">{formatDateTime(inv.voidAt)}</p>
                      {inv.voidReason && <p className="text-[10px] text-text-secondary">{inv.voidReason}</p>}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
