'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/shared/page-header';
import { Button } from '@/components/ui/button';
import { MessageSquare, Phone, Mail, FileText, ChevronRight, Loader2 } from 'lucide-react';
import api from '@/lib/api/client';
import { useToast } from '@/components/ui/use-toast';

const supportTopics = [
  { icon: FileText, title: 'Order & Delivery', description: 'Help with order tracking, returns, and delivery issues', articles: 15 },
  { icon: MessageSquare, title: 'Payment & Refunds', description: 'Payment processing, refund status, and billing queries', articles: 10 },
  { icon: Phone, title: 'Account & Security', description: 'Account settings, password reset, and security concerns', articles: 7 },
  { icon: Mail, title: 'RFQ & Quotes', description: 'Help with requesting and managing quotes from suppliers', articles: 9 },
];

export default function BuyerSupportPage() {
  const { toast } = useToast();
  const [tickets, setTickets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get('/buyer/notifications?type=support&limit=5')
      .then(res => setTickets((res.data?.data || res.data || []).slice(0, 5)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-6xl mx-auto px-4">
        <PageHeader title="Buyer Support" description="We're here to help with your orders, payments, and more." />

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
          <p className="mt-1 text-sm text-white/50">Track the status of your support requests</p>
          <div className="mt-4 space-y-3">
            {loading ? (
              <div className="flex items-center justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-white/40" /></div>
            ) : tickets.length === 0 ? (
              <p className="text-sm text-white/40">No support tickets yet.</p>
            ) : (
              tickets.map((ticket: any) => (
                <div
                  key={ticket.id}
                  className="flex items-center justify-between gap-4 rounded-2xl border border-white/[0.06] bg-white/[0.04] p-4 backdrop-blur-md transition-all duration-200 hover:border-[#FF4D00]/10 hover:bg-white/[0.06]"
                >
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-xs font-mono text-white/40">{ticket.id?.slice(0, 8)}</p>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        ticket.read ? 'bg-green-500/10 text-green-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>
                        {ticket.read ? 'resolved' : 'open'}
                      </span>
                    </div>
                    <p className="mt-1 text-sm font-medium text-white">{ticket.title || ticket.message || ticket.subject}</p>
                  </div>
                  <p className="text-xs text-white/40">{ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString('en-IN') : '-'}</p>
                </div>
              ))
            )}
          </div>
        </div>

        <div className="mt-8 rounded-3xl p-6" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <h2 className="text-lg font-semibold text-white">Need Immediate Help?</h2>
          <p className="mt-1 text-sm text-white/50">Our support team is available 24/7 to assist you.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <button className="flex items-center gap-2 rounded-2xl bg-[#FF4D00] px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#FF4D00]/90">
              <MessageSquare className="h-4 w-4" />
              Start Live Chat
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
              <Mail className="h-4 w-4" />
              Email Us
            </button>
            <button className="flex items-center gap-2 rounded-2xl border border-white/[0.09] bg-white/[0.04] px-5 py-2.5 text-sm font-medium text-white backdrop-blur-md transition-colors hover:border-[#FF4D00]/30 hover:text-[#FF4D00]">
              <Phone className="h-4 w-4" />
              +91 1800-TRADINGO
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
