import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { CTABlock } from '@/components/shared/cta-block';

export const metadata: Metadata = {
  title: 'Buyer Agreement | TRADINGO',
  description: 'TRADINGO Buyer Agreement governing purchasing, payments, returns, refunds, and supplier communications on India\'s first Trusted Electronic Marketplace (TEM).',
  openGraph: {
    title: 'Buyer Agreement | TRADINGO',
    description: 'Review the TRADINGO Buyer Agreement including purchasing rules, payment terms, return policies, and dispute resolution.',
    type: 'website',
    siteName: 'TRADINGO',
  },
};

const sections = [
  {
    title: '1. Eligibility',
    content: 'To purchase on TRADINGO, you must meet certain eligibility criteria. Buyers must be legally capable of entering into binding contracts and provide accurate registration information.',
    subsections: [
      {
        heading: 'Age & Capacity',
        text: 'You must be at least 18 years old and legally capable of entering into binding contracts. Businesses must designate an authorized representative for transactions.',
      },
      {
        heading: 'Business Verification',
        text: 'Business buyers may be required to provide GST registration, PAN card, and business address verification. Verified business buyers may access additional features including credit terms and bulk pricing.',
      },
      {
        heading: 'Account Approval',
        text: 'TRADINGO reserves the right to approve or reject buyer registrations based on our verification process and risk assessment criteria.',
      },
    ],
  },
  {
    title: '2. Account Registration',
    content: 'Buyers must create an account and provide accurate, complete information. You are responsible for maintaining your account and ensuring all activities comply with these terms.',
    subsections: [
      {
        heading: 'Registration Information',
        text: 'You must provide accurate personal or business information during registration, including full name, email address, phone number, business details, and delivery address.',
      },
      {
        heading: 'Account Security',
        text: 'You are responsible for maintaining the security of your account credentials. Notify TRADINGO immediately if you suspect unauthorized access to your account.',
      },
      {
        heading: 'Account Use',
        text: 'Your account is personal and non-transferable. You may not use another person\'s account or allow others to use your account for transactions.',
      },
    ],
  },
  {
    title: '3. Purchasing',
    content: 'All purchases on TRADINGO are subject to these terms. Buyers must act in good faith and complete transactions they initiate through the platform.',
    subsections: [
      {
        heading: 'Order Placement',
        text: 'When you place an order, you are making a binding offer to purchase the listed products at the stated price. TRADINGO may facilitate order confirmation, but the final contract is between you and the seller.',
      },
      {
        heading: 'Order Modifications',
        text: 'Order modifications after confirmation are subject to seller approval. TRADINGO may facilitate modification requests but cannot guarantee acceptance by the seller.',
      },
      {
        heading: 'Bulk & Custom Orders',
        text: 'Bulk orders and custom product requests are governed by additional terms specified in the RFQ (Request for Quote) process. RFQ terms are binding once accepted by both parties.',
      },
      {
        heading: 'RFQ Process',
        text: 'Buyers may submit RFQs for products they wish to purchase. Submitted RFQs are binding commitments to evaluate quotes received. Withdrawal of RFQs after receiving quotes may be subject to penalties.',
      },
    ],
  },
  {
    title: '4. Payments',
    content: 'Payments for purchases on TRADINGO are processed through our secure payment system. Buyers must ensure timely payment as per the transaction terms.',
    subsections: [
      {
        heading: 'Payment Methods',
        text: 'TRADINGO accepts payments via bank transfer (NEFT/RTGS/IMPS), credit/debit cards, UPI, and other methods as displayed on the platform. Available payment methods may vary based on transaction value and buyer verification level.',
      },
      {
        heading: 'Escrow Protection',
        text: 'Payments are held in TRADINGO\'s secure escrow account until order fulfillment is confirmed. This protects both buyers and sellers by ensuring funds are released only upon satisfactory delivery.',
      },
      {
        heading: 'Payment Timeline',
        text: 'Payment must be completed within the specified payment window, typically 24-48 hours from order confirmation. Failure to complete payment may result in automatic order cancellation.',
      },
      {
        heading: 'Tax Invoicing',
        text: 'TRADINGO facilitates GST-compliant invoicing between buyers and sellers. You will receive a tax invoice from the seller for each completed transaction.',
      },
    ],
  },
  {
    title: '5. Returns & Refunds',
    content: 'TRADINGO offers a structured return and refund process to protect buyer interests. Return eligibility and timelines vary by product category and seller policy.',
    subsections: [
      {
        heading: 'Return Eligibility',
        text: 'Products may be returned within the specified return window (typically 7-14 days from delivery) if they are defective, damaged, not as described, or do not match specifications.',
      },
      {
        heading: 'Return Process',
        text: 'Buyers must initiate returns through the platform, providing evidence of the issue (photos, videos, or inspection reports). TRADINGO will facilitate communication with the seller for resolution.',
      },
      {
        heading: 'Refund Processing',
        text: 'Approved refunds are processed within 5-10 business days after the seller confirms receipt of returned goods. Refunds are credited to the original payment method or GOCASH wallet.',
      },
      {
        heading: 'Non-Returnable Items',
        text: 'Custom products, perishable goods, digital downloads, and items explicitly marked as non-returnable are not eligible for return unless defective or not as described.',
      },
    ],
  },
  {
    title: '6. Supplier Communication',
    content: 'All communications with suppliers must be conducted through TRADINGO\'s platform. This ensures transparency, record-keeping, and dispute resolution capability.',
    subsections: [
      {
        heading: 'Platform Communication',
        text: 'Use TRADINGO\'s messaging system for all supplier interactions related to orders, quotes, negotiations, and inquiries. Off-platform communication that circumvents TRADINGO is prohibited.',
      },
      {
        heading: 'Professional Conduct',
        text: 'Buyers must communicate respectfully and professionally. Harassment, abuse, or intimidating behavior towards sellers or TRADINGO staff will result in account action.',
      },
      {
        heading: 'Confidentiality',
        text: 'Business information shared during negotiations and transactions must be kept confidential. Misuse of supplier information for purposes outside the platform is prohibited.',
      },
    ],
  },
  {
    title: '7. Prohibited Conduct',
    content: 'Buyers must not engage in conduct that violates these terms, applicable laws, or the integrity of the marketplace.',
    subsections: [
      {
        heading: 'Fraudulent Activity',
        text: 'Submitting false claims, chargeback abuse, creating fake orders, or engaging in any fraudulent activity is strictly prohibited and will result in account termination and legal action.',
      },
      {
        heading: 'Marketplace Manipulation',
        text: 'Price manipulation, fake bids, collusion with sellers to circumvent platform fees, or any activity that undermines marketplace integrity is prohibited.',
      },
      {
        heading: 'Policy Circumvention',
        text: 'Attempting to bypass TRADINGO\'s payment, escrow, or dispute resolution systems is prohibited. Transactions must be completed through the platform\'s official processes.',
      },
      {
        heading: 'Multiple Accounts',
        text: 'Creating or using multiple buyer accounts without TRADINGO\'s consent is prohibited and may result in suspension of all associated accounts.',
      },
    ],
  },
  {
    title: '8. Intellectual Property',
    content: 'This section governs intellectual property rights related to platform content and buyer-generated content.',
    subsections: [
      {
        heading: 'Platform Content',
        text: 'TRADINGO\'s platform design, logo, trademarks, and content are our intellectual property. You may not copy, reproduce, or use them without authorization.',
      },
      {
        heading: 'User Reviews',
        text: 'By posting reviews or feedback, you grant TRADINGO a non-exclusive, royalty-free license to display and use your content for platform operations. You warrant that your reviews are truthful and based on actual experience.',
      },
      {
        heading: 'Supplier IP',
        text: 'Product images, descriptions, and specifications shared by suppliers are their intellectual property. You may not reuse supplier content outside the platform without permission.',
      },
    ],
  },
  {
    title: '9. Termination',
    content: 'Either party may terminate this agreement as described below. Termination does not affect obligations for transactions already in progress.',
    subsections: [
      {
        heading: 'Termination by Buyer',
        text: 'You may delete your buyer account at any time through account settings. Pending orders must be fulfilled or cancelled before account deletion.',
      },
      {
        heading: 'Termination by TRADINGO',
        text: 'TRADINGO may suspend or terminate buyer accounts for policy violations, fraudulent activity, chargeback abuse, or conduct that harms the platform community.',
      },
      {
        heading: 'Effect of Termination',
        text: 'Upon termination, access to your account and transaction history ceases. Outstanding refunds will be processed according to applicable policies.',
      },
    ],
  },
  {
    title: '10. Limitation of Liability',
    content: 'TRADINGO\'s liability to buyers is limited as described herein. The platform acts as an intermediary connecting buyers with sellers.',
    subsections: [
      {
        heading: 'Platform Role',
        text: 'TRADINGO is a marketplace platform and is not a party to transactions between buyers and sellers. We do not guarantee product quality, safety, or legality.',
      },
      {
        heading: 'No Warranties',
        text: 'The platform is provided "as is" without any warranties, express or implied, including but not limited to merchantability or fitness for a particular purpose.',
      },
      {
        heading: 'Liability Cap',
        text: 'TRADINGO\'s total liability for any claim arising from your use of the platform shall not exceed the total fees paid by you in the 12 months preceding the claim, or INR 10,000, whichever is lower.',
      },
    ],
  },
  {
    title: '11. Dispute Resolution',
    content: 'Disputes with sellers or TRADINGO are resolved through a structured process designed to ensure fair outcomes for all parties.',
    subsections: [
      {
        heading: 'Internal Resolution',
        text: 'File a dispute through the platform within 7 days of the issue arising. TRADINGO\'s resolution team will review evidence and facilitate a fair outcome.',
      },
      {
        heading: 'Mediation',
        text: 'If internal resolution is unsuccessful, both parties agree to participate in mediation conducted by a mutually agreed mediator before pursuing legal action.',
      },
      {
        heading: 'Arbitration',
        text: 'Unresolved disputes shall be settled by binding arbitration in Mumbai, Maharashtra, under the Arbitration and Conciliation Act, 1996.',
      },
    ],
  },
  {
    title: '12. Governing Law',
    content: 'This agreement is governed by the laws of India. Courts in Mumbai, Maharashtra have exclusive jurisdiction over all disputes.',
    subsections: [
      {
        heading: 'Applicable Law',
        text: 'This agreement is governed by the laws of the Republic of India, including the Information Technology Act, 2000, and the Indian Contract Act, 1872.',
      },
      {
        heading: 'Jurisdiction',
        text: 'All legal proceedings shall be brought exclusively in the courts of Mumbai, Maharashtra.',
      },
      {
        heading: 'Severability',
        text: 'If any provision is found unenforceable, the remaining provisions continue in full effect. Invalid provisions shall be limited to the minimum extent necessary.',
      },
    ],
  },
  {
    title: '13. Contact',
    content: 'For questions about this Buyer Agreement, please contact us through the following channels.',
    subsections: [
      {
        heading: 'Email',
        text: 'buyersupport@tradingo.in',
      },
      {
        heading: 'Support Portal',
        text: 'Available through your buyer dashboard under the Support section.',
      },
      {
        heading: 'Registered Address',
        text: 'TRADINGO Technologies Pvt. Ltd., Mumbai, Maharashtra, India.',
      },
    ],
  },
];

export default function BuyerAgreementPage() {
  return (
    <>
      <PageHeader
        title="Buyer Agreement"
        description="The terms and conditions governing buyer accounts and purchases on the TRADINGO platform."
      />

      <section className="py-12">
        <div className="container-main">
          <div className="mx-auto max-w-3xl">
            <p className="mb-12 text-sm text-text-secondary">
              Last updated: July 1, 2026
            </p>

            {sections.map((section) => (
              <div key={section.title} className="mb-12 last:mb-0">
                <h2 className="mb-4 text-2xl font-bold text-text-primary">
                  {section.title}
                </h2>
                <p className="mb-6 leading-relaxed text-text-secondary">
                  {section.content}
                </p>
                {section.subsections.length > 0 && (
                  <div className="space-y-6">
                    {section.subsections.map((sub) => (
                      <div key={sub.heading}>
                        <h3 className="mb-2 text-lg font-semibold text-text-primary">
                          {sub.heading}
                        </h3>
                        <p className="leading-relaxed text-text-secondary">
                          {sub.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <p className="mt-16 text-sm text-text-secondary/60">
              This Buyer Agreement was last updated on July 1, 2026. Please review it periodically
              for any changes. Continued use of TRADINGO after updates constitutes acceptance of the
              revised terms.
            </p>
          </div>
        </div>
      </section>

      <CTABlock
        title="Ready to Start Buying?"
        subtitle="Join thousands of buyers on India's most trusted B2B marketplace. Create your buyer account today."
        primaryLabel="Create Buyer Account"
        primaryHref="/register/buyer"
        variant="simple"
      />
    </>
  );
}
