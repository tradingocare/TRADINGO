'use client'
import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion } from 'framer-motion'
import api from '@/lib/api/client'
import { Loader2, Download, Printer, ChevronLeft, FileText, CheckCircle, XCircle, Mail } from 'lucide-react'

const STATUS_MAP: Record<string, { label: string; color: string; icon: any }> = {
  PAID: { label: 'Paid', color: 'bg-green-100 text-green-800 border-green-200', icon: CheckCircle },
  GENERATED: { label: 'Generated', color: 'bg-blue-100 text-blue-800 border-blue-200', icon: FileText },
  SENT: { label: 'Sent', color: 'bg-purple-100 text-purple-800 border-purple-200', icon: Mail },
  VOID: { label: 'Void', color: 'bg-red-100 text-red-800 border-red-200', icon: XCircle },
  CANCELLED: { label: 'Cancelled', color: 'bg-gray-100 text-gray-500 border-gray-200', icon: XCircle },
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
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [invoiceId])

  const handlePdf = async () => {
    try {
      const res = await api.get(`/billing/invoices/${invoiceId}/pdf`, { responseType: 'blob' })
      const url = URL.createObjectURL(new Blob([res.data], { type: 'application/pdf' }))
      window.open(url, '_blank')
    } catch {}
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
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <Loader2 size={24} className="animate-spin text-orange-500" />
    </div>
  )

  if (!inv) return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <p className="text-sm text-gray-400">Invoice not found</p>
    </div>
  )

  const StatusIcon = STATUS_MAP[inv.status]?.icon || FileText

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <button onClick={() => router.back()} className="p-2 rounded-lg hover:bg-gray-200 transition-all">
            <ChevronLeft size={18} className="text-gray-600" />
          </button>
          <h1 className="text-2xl font-black text-gray-900">Invoice Details</h1>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
          <div className="xl:col-span-2 space-y-6">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-6">
              <div className="flex items-start justify-between mb-6">
                <div className="flex items-center gap-3">
                  <div className={`px-3 py-1.5 rounded-lg flex items-center gap-2 text-xs font-bold border ${STATUS_MAP[inv.status]?.color || 'border-gray-200 text-gray-600'}`}>
                    <StatusIcon size={14} />
                    {STATUS_MAP[inv.status]?.label || inv.status}
                  </div>
                  <span className="text-xs text-gray-400">Issued {formatDate(inv.issuedAt)}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={handlePdf}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                    <Download size={14} /> PDF
                  </button>
                  <button onClick={() => window.print()}
                    className="px-3 py-2 rounded-lg border border-gray-200 text-xs font-semibold text-gray-600 hover:bg-gray-50 flex items-center gap-1.5 transition-all">
                    <Printer size={14} /> Print
                  </button>
                </div>
              </div>

              <div className="flex items-center justify-between pb-4 mb-4 border-b border-gray-100">
                <div>
                  <h2 className="text-xl font-black text-gray-900">{inv.invoiceNumber}</h2>
                  <p className="text-sm text-gray-500">{inv.planName || inv.planId} ({inv.planTier})</p>
                </div>
                <p className="text-2xl font-black text-gray-900">{formatAmount(inv.totalAmount)}</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Seller</h3>
                  <p className="text-sm font-bold text-gray-900">{inv.company?.name || '—'}</p>
                  {inv.company?.email && <p className="text-xs text-gray-500">{inv.company.email}</p>}
                  {inv.company?.gstNumber && <p className="text-xs text-gray-500">GST: {inv.company.gstNumber}</p>}
                  {inv.company?.panNumber && <p className="text-xs text-gray-500">PAN: {inv.company.panNumber}</p>}
                </div>
                <div className="text-right">
                  {inv.company?.locations?.[0]?.addressLine1 && (
                    <>
                      <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Address</h3>
                      <p className="text-xs text-gray-500">{inv.company.locations[0].addressLine1}</p>
                      <p className="text-xs text-gray-500">
                        {[inv.company.locations[0].city, inv.company.locations[0].state, inv.company.locations[0].pincode].filter(Boolean).join(', ')}
                      </p>
                    </>
                  )}
                </div>
              </div>

              {inv.gstType && (
                <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">GST Breakdown</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div>
                      <p className="text-[10px] text-gray-400">GST Type</p>
                      <p className="text-sm font-bold text-gray-900">{inv.gstType}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-gray-400">{inv.gstType === 'IGST' ? 'IGST Amount' : 'CGST Amount'}</p>
                      <p className="text-sm font-bold text-gray-900">{formatAmount(inv.gstType === 'IGST' ? inv.igstAmount : inv.cgstAmount)}</p>
                    </div>
                    {inv.gstType !== 'IGST' && (
                      <div>
                        <p className="text-[10px] text-gray-400">SGST Amount</p>
                        <p className="text-sm font-bold text-gray-900">{formatAmount(inv.sgstAmount)}</p>
                      </div>
                    )}
                  </div>
                  {inv.hsnSacCode && <p className="text-[10px] text-gray-400 mt-2">HSN/SAC: {inv.hsnSacCode}</p>}
                </div>
              )}

              {inv.items && inv.items.length > 0 && (
                <div>
                  <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-2">Items</h3>
                  <div className="divide-y divide-gray-100">
                    {inv.items.map((item: any, i: number) => (
                      <div key={i} className="flex items-center justify-between py-2">
                        <div>
                          <p className="text-sm font-semibold text-gray-900">{item.description || item.name}</p>
                          {item.quantity && <p className="text-xs text-gray-400">Qty: {item.quantity}</p>}
                        </div>
                        <p className="text-sm font-bold text-gray-900">{formatAmount(item.amount || item.price)}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-4 mt-4 border-t border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Subtotal</span>
                  <span className="text-xs text-gray-700">{formatAmount(inv.subtotal)}</span>
                </div>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs text-gray-500">Tax</span>
                  <span className="text-xs text-gray-700">{formatAmount(inv.taxAmount)}</span>
                </div>
                <div className="flex items-center justify-between pt-2 mt-2 border-t border-gray-100">
                  <span className="text-sm font-bold text-gray-900">Total</span>
                  <span className="text-lg font-black text-gray-900">{formatAmount(inv.totalAmount)}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Payment Info</h3>
              <div className="space-y-2">
                <div>
                  <p className="text-[10px] text-gray-400">Gateway</p>
                  <p className="text-xs font-semibold text-gray-900">{inv.payment?.gateway || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Payment ID</p>
                  <p className="text-xs text-gray-700 break-all">{inv.payment?.gatewayPaymentId || '—'}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Amount Paid</p>
                  <p className="text-xs font-semibold text-gray-900">{formatAmount(inv.payment?.amount)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-400">Paid At</p>
                  <p className="text-xs text-gray-700">{formatDateTime(inv.paidAt)}</p>
                </div>
              </div>
            </div>

            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-5">
              <h3 className="text-[10px] uppercase tracking-widest font-bold text-gray-400 mb-3">Timeline</h3>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                  <div>
                    <p className="text-xs font-semibold text-gray-900">Issued</p>
                    <p className="text-[10px] text-gray-400">{formatDateTime(inv.issuedAt)}</p>
                  </div>
                </div>
                {inv.paidAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-green-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Paid</p>
                      <p className="text-[10px] text-gray-400">{formatDateTime(inv.paidAt)}</p>
                    </div>
                  </div>
                )}
                {inv.voidAt && (
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 rounded-full bg-red-400 mt-1.5 shrink-0" />
                    <div>
                      <p className="text-xs font-semibold text-gray-900">Voided</p>
                      <p className="text-[10px] text-gray-400">{formatDateTime(inv.voidAt)}</p>
                      {inv.voidReason && <p className="text-[10px] text-gray-500">{inv.voidReason}</p>}
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
