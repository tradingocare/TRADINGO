import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { CTABlock } from '@/components/shared/cta-block';

export const metadata: Metadata = {
  title: 'Seller Agreement | TRADINGO',
  description: 'TRADINGO Seller Agreement governing product listings, fees, commissions, payment terms, and order fulfillment for sellers on India\'s first Trusted Electronic Marketplace (TEM).',
  openGraph: {
    title: 'Seller Agreement | TRADINGO',
    description: 'Review the TRADINGO Seller Agreement including eligibility, fees, payment terms, and fulfillment obligations.',
    type: 'website',
    siteName: 'TRADINGO',
  },
};

const sections = [
  {
    title: '1. Eligibility',
    content: 'To register as a seller on TRADINGO, you must meet certain eligibility criteria. Sellers must be legally authorized to conduct business in India and provide accurate documentation for verification.',
    subsections: [
      {
        heading: 'Business Entity',
        text: 'You must be a registered business entity with a valid GST registration, PAN card, and applicable trade licenses. Individual sellers must provide government-issued ID and bank account details for verification.',
      },
      {
        heading: 'Age & Capacity',
        text: 'You must be at least 18 years old and legally capable of entering into binding contracts. Businesses must designate an authorized representative who meets these requirements.',
      },
      {
        heading: 'Verification Process',
        text: 'All sellers must complete TRADINGO\'s verification process, which includes submitting business documents, identity proof, address proof, and bank account information. TRADINGO may conduct periodic reverification.',
      },
    ],
  },
  {
    title: '2. Account Registration',
    content: 'Sellers must create a seller account and provide accurate, complete, and up-to-date information. Each seller may maintain only one seller account unless otherwise authorized by TRADINGO.',
    subsections: [
      {
        heading: 'Account Creation',
        text: 'You must register using accurate business information, including legal business name, trading name, business address, contact details, and tax identification numbers.',
      },
      {
        heading: 'Account Security',
        text: 'You are responsible for maintaining the confidentiality of your account credentials. Any activity conducted through your account is your responsibility. Notify TRADINGO immediately of any unauthorized access.',
      },
      {
        heading: 'Multiple Accounts',
        text: 'Operating multiple seller accounts without explicit written consent from TRADINGO is prohibited and may result in account suspension or termination.',
      },
    ],
  },
  {
    title: '3. Product Listings',
    content: 'Sellers are responsible for creating accurate, complete, and compliant product listings. All listings must adhere to TRADINGO\'s catalog quality standards and category-specific requirements.',
    subsections: [
      {
        heading: 'Listing Accuracy',
        text: 'Product listings must include accurate descriptions, specifications, pricing, stock availability, and high-quality images. Misleading, deceptive, or incomplete listings are strictly prohibited.',
      },
      {
        heading: 'Catalog Standards',
        text: 'Listings must conform to TRADINGO\'s master catalog taxonomy and quality standards. TRADINGO may reject, unpublish, or request modifications to listings that fail to meet quality thresholds.',
      },
      {
        heading: 'Pricing',
        text: 'Sellers must set fair and accurate prices inclusive of all applicable taxes. Dynamic pricing is permitted but must not involve price manipulation, collusion, or predatory pricing practices.',
      },
      {
        heading: 'Inventory Management',
        text: 'Sellers must maintain accurate inventory records and promptly update stock levels. Failure to fulfill orders due to inventory discrepancies may result in penalties.',
      },
    ],
  },
  {
    title: '4. Fees & Commission',
    content: 'TRADINGO charges fees for using the platform, including listing fees, transaction commissions, and subscription fees based on the seller\'s chosen plan. All fees are disclosed transparently.',
    subsections: [
      {
        heading: 'Commission Structure',
        text: 'A commission is charged on each successful transaction processed through the platform. The commission rate varies by product category and seller plan tier as detailed on the pricing page.',
      },
      {
        heading: 'Subscription Plans',
        text: 'Sellers may choose from various subscription plans (Trade Smart, Plus, Pro, Premium, Elite) offering different features, commission rates, and benefits. Plan details and pricing are available on our plans page.',
      },
      {
        heading: 'Payment of Fees',
        text: 'Fees are deducted from your settlement amount before disbursement. You authorize TRADINGO to collect applicable fees, taxes, and charges from your transaction proceeds and GOCASH wallet.',
      },
      {
        heading: 'Fee Changes',
        text: 'TRADINGO reserves the right to modify fees with 30 days\' prior notice. Continued use of the platform after fee changes constitutes acceptance of the new fee structure.',
      },
    ],
  },
  {
    title: '5. Payment Terms',
    content: 'Payments to sellers are processed through TRADINGO\'s secure payment system. Settlement cycles, payout methods, and holding periods are governed by the terms below.',
    subsections: [
      {
        heading: 'Settlement Cycle',
        content: 'Settlements are processed on a T+3 basis (transaction date plus 3 business days) after order confirmation and delivery verification. Premium plan sellers may qualify for faster settlement cycles.',
      },
      {
        heading: 'Payment Methods',
        text: 'Settlements are disbursed to the registered bank account linked to your seller profile. TRADINGO supports NEFT/RTGS/IMPS transfers. International sellers may receive payments through applicable cross-border channels.',
      },
      {
        heading: 'Payment Holds',
        text: 'TRADINGO may hold payments for orders under dispute, quality investigation, or fraud review. Held amounts are released upon resolution of the underlying issue.',
      },
      {
        heading: 'Tax Deductions',
        text: 'Applicable taxes including TDS (Tax Deducted at Source) under the Income Tax Act will be deducted as per statutory requirements. TRADINGO will provide tax certificates for all deductions.',
      },
    ],
  },
  {
    title: '6. Order Fulfillment',
    content: 'Sellers are responsible for timely and accurate order fulfillment. All orders must be processed, packed, and shipped in accordance with the promised delivery timelines and quality standards.',
    subsections: [
      {
        heading: 'Order Processing',
        text: 'Orders must be acknowledged within 24 hours and dispatched within the promised handling time. Delayed processing may result in automatic order cancellation and penalty fees.',
      },
      {
        heading: 'Shipping Standards',
        text: 'Products must be securely packaged and shipped using reliable carriers. Tracking information must be provided within the platform for all shipments.',
      },
      {
        heading: 'Quality Assurance',
        text: 'Products must match the listing description in specification, condition, quantity, and quality. Sellers are liable for defects, damages, or discrepancies in delivered products.',
      },
      {
        heading: 'Cancellations & Returns',
        text: 'Sellers must honor cancellations requested before dispatch. Return requests must be processed according to TRADINGO\'s return policy. Unauthorized cancellations or return refusal may result in penalties.',
      },
    ],
  },
  {
    title: '7. Prohibited Items',
    content: 'Sellers must not list, offer, or sell items that are prohibited by law or TRADINGO policy. Violation of prohibited items policy may result in immediate account termination and legal action.',
    subsections: [
      {
        heading: 'Illegal Items',
        text: 'Weapons, narcotics, counterfeit goods, stolen property, unauthorized financial instruments, and any items prohibited under Indian law are strictly forbidden.',
      },
      {
        heading: 'Restricted Categories',
        text: 'Certain categories require additional approvals, certifications, or licenses. This includes pharmaceuticals, chemicals, food products, electronics, and items requiring BIS certification.',
      },
      {
        heading: 'Intellectual Property Infringement',
        text: 'Listings that infringe on third-party trademarks, copyrights, patents, or designs are prohibited. Sellers must have proper authorization to sell branded products.',
      },
      {
        heading: 'Penalties',
        text: 'Listing prohibited items may result in immediate removal of listings, account suspension, forfeiture of fees, and legal action. TRADINGO will cooperate with law enforcement authorities.',
      },
    ],
  },
  {
    title: '8. Intellectual Property',
    content: 'This agreement governs the use of intellectual property related to the TRADINGO platform and seller content. Both parties retain their respective IP rights as described herein.',
    subsections: [
      {
        heading: 'Platform IP',
        text: 'TRADINGO\'s name, logo, TEM framework, TRADHEXA engines, and platform design are our exclusive intellectual property. Sellers may not use these without prior written consent.',
      },
      {
        heading: 'Seller Content License',
        text: 'By listing products, you grant TRADINGO a non-exclusive, royalty-free, worldwide license to use, reproduce, and display your product content (images, descriptions, specifications) for platform operations and marketing.',
      },
      {
        heading: 'Brand Rights',
        text: 'Sellers warrant that they own or have valid licenses for all intellectual property rights in their listed products and content. Sellers indemnify TRADINGO against third-party IP claims.',
      },
    ],
  },
  {
    title: '9. Termination',
    content: 'Either party may terminate this agreement under the conditions specified below. Termination does not affect obligations for transactions already in progress.',
    subsections: [
      {
        heading: 'Termination by Seller',
        text: 'You may terminate your seller account at any time through account settings. Outstanding orders must be fulfilled before termination takes effect.',
      },
      {
        heading: 'Termination by TRADINGO',
        text: 'TRADINGO may suspend or terminate seller accounts for policy violations, fraudulent activity, poor performance (high cancellation rates, negative feedback), or conduct harming the platform.',
      },
      {
        heading: 'Effect of Termination',
        text: 'Upon termination, pending orders must be fulfilled or cancelled as per TRADINGO direction. Outstanding settlements will be processed after a 90-day hold period for potential chargebacks or disputes.',
      },
    ],
  },
  {
    title: '10. Limitation of Liability',
    content: 'TRADINGO\'s liability is limited as described in this section. The platform acts as an intermediary and is not responsible for the quality, safety, or legality of products listed by sellers.',
    subsections: [
      {
        heading: 'Platform Role',
        text: 'TRADINGO provides a marketplace platform and does not own, store, or ship products. We are not a party to the transaction between buyer and seller.',
      },
      {
        heading: 'No Warranties',
        text: 'The platform is provided "as is" without warranties of merchantability, fitness for a particular purpose, or non-infringement.',
      },
      {
        heading: 'Liability Cap',
        text: 'TRADINGO\'s total liability shall not exceed the total fees paid by the seller in the 12 months preceding the claim, or INR 10,000, whichever is lower.',
      },
    ],
  },
  {
    title: '11. Dispute Resolution',
    content: 'Disputes between sellers and buyers or between sellers and TRADINGO shall be resolved through the process outlined below.',
    subsections: [
      {
        heading: 'Buyer Disputes',
        text: 'Sellers must respond to buyer disputes within 48 hours. TRADINGO\'s dispute resolution team will review evidence from both parties and issue a binding decision.',
      },
      {
        heading: 'Seller Disputes',
        text: 'Sellers may appeal TRADINGO decisions through the seller support system within 7 days. Appeals are reviewed by a senior resolution team.',
      },
      {
        heading: 'Arbitration',
        text: 'Disputes not resolved through internal processes shall be settled by binding arbitration in Mumbai, Maharashtra, under the Arbitration and Conciliation Act, 1996.',
      },
    ],
  },
  {
    title: '12. Governing Law',
    content: 'This agreement shall be governed by the laws of India. Any legal proceedings shall be subject to the exclusive jurisdiction of courts in Mumbai, Maharashtra.',
    subsections: [
      {
        heading: 'Applicable Law',
        text: 'This agreement is governed by the laws of the Republic of India, including the Information Technology Act, 2000, the Indian Contract Act, 1872, and applicable GST laws.',
      },
      {
        heading: 'Jurisdiction',
        text: 'All disputes arising under this agreement shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.',
      },
      {
        heading: 'Severability',
        text: 'If any provision is found unenforceable, the remaining provisions shall continue in full force and effect. The invalid provision shall be modified to the minimum extent necessary.',
      },
    ],
  },
  {
    title: '13. Contact',
    content: 'For questions about this Seller Agreement, please contact TRADINGO through the following channels.',
    subsections: [
      {
        heading: 'Email',
        text: 'sellersupport@tradingo.in',
      },
      {
        heading: 'Seller Support Portal',
        text: 'Available through your seller dashboard under the Support section.',
      },
      {
        heading: 'Registered Address',
        text: 'TRADINGO Technologies Pvt. Ltd., Mumbai, Maharashtra, India.',
      },
    ],
  },
];

export default function SellerAgreementPage() {
  return (
    <>
      <PageHeader
        title="Seller Agreement"
        description="The terms and conditions governing seller accounts and operations on the TRADINGO platform."
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
              This Seller Agreement was last updated on July 1, 2026. Please review it periodically
              for any changes. Continued use of TRADINGO after updates constitutes acceptance of the
              revised terms.
            </p>
          </div>
        </div>
      </section>

      <CTABlock
        title="Ready to Start Selling?"
        subtitle="Join thousands of sellers on India's most trusted B2B marketplace. Create your seller account today."
        primaryLabel="Create Seller Account"
        primaryHref="/register/vendor"
        variant="simple"
      />
    </>
  );
}
