'use client'
import { PageHeader } from '@/components/shared/page-header'

const refundSections = [
  {
    title: '1. Refund Eligibility',
    content: 'Refunds are available for transactions conducted through the TRADINGO platform under the following conditions:',
    subsections: [
      { heading: 'Product Not Received', text: 'If the buyer does not receive the product within the agreed delivery timeline, a full refund will be processed through the escrow system.' },
      { heading: 'Product Not as Described', text: 'If the delivered product significantly differs from the listing description (quality, specifications, quantity), the buyer is eligible for a full or partial refund.' },
      { heading: 'Damaged in Transit', text: 'Products damaged during transit are eligible for full refund. The buyer must report damage within 48 hours of delivery with photographic evidence.' },
      { heading: 'Seller Cancellation', text: 'If a seller cancels an order after confirmation, the buyer receives an automatic full refund within 3-5 business days.' },
    ],
  },
  {
    title: '2. How to Request a Refund',
    content: 'Follow these steps to initiate a refund request on TRADINGO:',
    subsections: [
      { heading: 'Step 1: File a Dispute', text: 'Log in to your account, navigate to the order details, and click "Request Refund". Provide a clear reason and supporting evidence (photos, communications).' },
      { heading: 'Step 2: Review Process', text: 'Our dispute resolution team reviews the case within 3 business days. Both buyer and seller may be contacted for additional information.' },
      { heading: 'Step 3: Resolution', text: 'Once the dispute is reviewed, a resolution is communicated. If approved, the refund is processed through the original payment method.' },
    ],
  },
  {
    title: '3. Refund Timeline',
    content: 'Refund processing times depend on the payment method used:',
    subsections: [
      { heading: 'Escrow Release', text: 'For escrow-protected transactions, funds are released back to the buyer within 1-2 business days of dispute approval.' },
      { heading: 'Bank Transfer', text: 'Refunds to bank accounts typically take 3-5 business days after escrow release.' },
      { heading: 'Digital Wallets', text: 'GOCASH or wallet refunds are processed instantly upon dispute approval.' },
    ],
  },
  {
    title: '4. Non-Refundable Situations',
    content: 'The following are not eligible for refunds on TRADINGO:',
    subsections: [
      { heading: 'Buyer remorse', text: 'Refunds are not available simply because the buyer changed their mind after confirming an order.' },
      { heading: 'Custom orders', text: 'Products manufactured or customized to buyer specifications are non-refundable unless they fail to meet the agreed specifications.' },
      { heading: 'Delayed reporting', text: 'Disputes filed more than 7 days after delivery may not be eligible for refund.' },
      { heading: 'Partial usage', text: 'Products that have been partially used, processed, or installed are not eligible for full refunds.' },
    ],
  },
  {
    title: '5. Dispute Resolution',
    content: 'TRADINGO provides a structured dispute resolution process to ensure fair outcomes for both buyers and sellers:',
    subsections: [
      { heading: 'Mediation', text: 'Our dispute team facilitates communication between parties to reach an amicable resolution before making a final determination.' },
      { heading: 'Escalation', text: 'If the initial resolution is unsatisfactory, either party may escalate the case to senior review within 5 business days.' },
      { heading: 'Final Decision', text: 'TRADINGO\'s dispute resolution decision is final for platform-related matters. Legal recourse is available as per our Terms of Service.' },
    ],
  },
  {
    title: '6. Contact Support',
    content: 'If you have questions about a refund or need assistance with a dispute, contact our support team at support@tradingo.com or call +91 1800-TRADINGO. Our team is available 24/7 to help resolve your concerns.',
    subsections: [],
  },
]

export default function RefundPage() {
  return (
    <div className="min-h-screen pt-24 pb-16" style={{ background: '#1D0001' }}>
      <div className="max-w-4xl mx-auto px-4">
        <PageHeader
          title="Refund Policy"
          description="Our commitment to fair and transparent refund practices."
        />
        <div className="mt-8 rounded-3xl p-6 sm:p-8" style={{ background: 'rgba(255,255,255,0.04)', backdropFilter: 'blur(24px)', border: '1px solid rgba(255,255,255,0.09)' }}>
          <p className="mb-10 text-sm text-white/40">Last updated: June 1, 2025</p>

          {refundSections.map((section) => (
            <div key={section.title} className="mb-10 last:mb-0">
              <h2 className="mb-3 text-xl font-bold text-white">{section.title}</h2>
              <p className="mb-5 leading-relaxed text-white/60">{section.content}</p>
              {section.subsections.length > 0 && (
                <div className="space-y-5">
                  {section.subsections.map((sub) => (
                    <div key={sub.heading}>
                      <h3 className="mb-1.5 text-base font-semibold text-white/90">{sub.heading}</h3>
                      <p className="leading-relaxed text-white/50">{sub.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}

          <p className="mt-14 text-xs text-white/30">
            This Refund Policy was last updated on June 1, 2025. We reserve the right to update this policy at any time.
            Changes will be effective immediately upon posting on this page.
          </p>
        </div>
      </div>
    </div>
  )
}
