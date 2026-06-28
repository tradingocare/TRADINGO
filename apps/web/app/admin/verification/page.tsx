'use client'

import { PageHeader } from '@/components/shared/page-header'
import { CheckCircle, XCircle, Eye, Clock, FileText } from 'lucide-react'

const verificationQueue = [
  { id: 'KYC-001', company: 'Kumar Steel Industries', type: 'Business KYC', submitted: '2026-06-23', documents: 4, status: 'pending' },
  { id: 'KYC-002', company: 'Sharma Constructions', type: 'GST Verification', submitted: '2026-06-22', documents: 3, status: 'pending' },
  { id: 'KYC-003', company: 'Patel Electricals', type: 'Business KYC', submitted: '2026-06-21', documents: 5, status: 'under-review' },
  { id: 'KYC-004', company: 'Bharat Cement Co.', type: 'PAN Verification', submitted: '2026-06-20', documents: 2, status: 'pending' },
  { id: 'KYC-005', company: 'AquaFlow Industries', type: 'Business KYC', submitted: '2026-06-19', documents: 4, status: 'rejected' },
]

const statusConfig: Record<string, { label: string; style: string; icon: React.ElementType }> = {
  pending: { label: 'Pending', style: 'bg-yellow-500/10 text-yellow-400', icon: Clock },
  'under-review': { label: 'Under Review', style: 'bg-blue-500/10 text-blue-400', icon: Eye },
  approved: { label: 'Approved', style: 'bg-green-500/10 text-green-400', icon: CheckCircle },
  rejected: { label: 'Rejected', style: 'bg-red-500/10 text-red-400', icon: XCircle },
}

const stats = [
  { label: 'Pending', value: 3, color: 'text-yellow-400' },
  { label: 'Under Review', value: 1, color: 'text-blue-400' },
  { label: 'Approved Today', value: 8, color: 'text-green-400' },
  { label: 'Rejected', value: 1, color: 'text-red-400' },
]

export default function AdminVerificationPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Verification Queue"
          description="Review and manage KYC and business verification submissions."
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div
              key={stat.label}
              className="rounded-3xl p-5"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <p className="text-xs text-white/50">{stat.label}</p>
              <p className={`mt-1 text-2xl font-bold ${stat.color}`}>{stat.value}</p>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-lg font-semibold text-white">Pending Reviews</h2>
          <p className="mt-1 text-sm text-white/50">Review submissions in order of oldest first</p>

          <div className="mt-6 space-y-3">
            {verificationQueue.map((item) => {
              const config = statusConfig[item.status]
              const StatusIcon = config.icon
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-5 backdrop-blur-md transition-all duration-200 hover:border-[#FF4D00]/10 hover:bg-white/[0.06]"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#FF4D00]/10 text-[#FF4D00]">
                      <FileText className="h-5 w-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-white">{item.company}</p>
                        <span className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${config.style}`}>
                          <StatusIcon className="h-3 w-3" />
                          {config.label}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-white/50">{item.type} &middot; {item.documents} documents &middot; Submitted {item.submitted}</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="rounded-xl border border-white/[0.09] bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
                      View
                    </button>
                    {item.status !== 'rejected' && (
                      <>
                        <button className="rounded-xl bg-green-500/10 px-3 py-1.5 text-xs font-medium text-green-400 transition-colors hover:bg-green-500/20">
                          Approve
                        </button>
                        <button className="rounded-xl bg-red-500/10 px-3 py-1.5 text-xs font-medium text-red-400 transition-colors hover:bg-red-500/20">
                          Reject
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
