'use client'

import { PageHeader } from '@/components/shared/page-header'
import { MessageSquare, Phone, Mail, FileText, ChevronRight } from 'lucide-react'

const supportTopics = [
  {
    icon: FileText,
    title: 'Order Issues',
    description: 'Problems with orders, deliveries, or payments',
    articles: 12,
  },
  {
    icon: MessageSquare,
    title: 'Product Listings',
    description: 'Help with creating and managing product listings',
    articles: 8,
  },
  {
    icon: Phone,
    title: 'Account & Billing',
    description: 'Account settings, subscription, and payment issues',
    articles: 6,
  },
  {
    icon: Mail,
    title: 'KYC & Verification',
    description: 'Help with identity and business verification',
    articles: 5,
  },
]

const recentTickets = [
  { id: 'TK-1042', subject: 'Payment not reflecting in wallet', status: 'open', date: '2026-06-22' },
  { id: 'TK-1038', subject: 'Unable to upload product images', status: 'resolved', date: '2026-06-20' },
  { id: 'TK-1035', subject: 'GST invoice not generated', status: 'open', date: '2026-06-18' },
]

export default function SellerSupportPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader
          title="Seller Support"
          description="Get help with your seller account and resolve issues quickly."
        />

        <div className="mt-8 grid gap-6 sm:grid-cols-2">
          {supportTopics.map((topic) => (
            <div
              key={topic.title}
              className="group rounded-3xl p-6 transition-all duration-300 hover:border-[#FF4D00]/20"
              style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}
            >
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#FF4D00]/10 text-[#FF4D00]">
                  <topic.icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-semibold text-white">{topic.title}</h3>
                  <p className="mt-1 text-xs text-white/50">{topic.description}</p>
                  <p className="mt-2 text-xs text-white/40">{topic.articles} articles</p>
                </div>
                <ChevronRight className="h-4 w-4 text-white/20 transition-colors group-hover:text-[#FF4D00]" />
              </div>
            </div>
          ))}
        </div>

        <div className="mt-8 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-lg font-semibold text-white">Recent Tickets</h2>
          <p className="mt-1 text-sm text-white/50">Track your support requests</p>
          <div className="mt-4 space-y-3">
            {recentTickets.map((ticket) => (
              <div
                key={ticket.id}
                className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-200 hover:border-[#FF4D00]/10 hover:bg-white/[0.06]"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="text-xs font-mono text-white/40">{ticket.id}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        ticket.status === 'open'
                          ? 'bg-yellow-500/10 text-yellow-400'
                          : 'bg-green-500/10 text-green-400'
                      }`}
                    >
                      {ticket.status}
                    </span>
                  </div>
                  <p className="mt-1 text-sm font-medium text-white">{ticket.subject}</p>
                </div>
                <p className="text-xs text-white/40">{ticket.date}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-8 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-lg font-semibold text-white">Contact Support</h2>
          <p className="mt-1 text-sm text-white/50">Can&apos;t find what you&apos;re looking for? Reach out directly.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-2xl bg-[#FF4D00] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/90">
              <MessageSquare className="h-4 w-4" />
              Live Chat
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
              <Mail className="h-4 w-4" />
              Email Support
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
              <Phone className="h-4 w-4" />
              Call Us
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
