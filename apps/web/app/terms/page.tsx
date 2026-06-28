import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { CTABlock } from '@/components/shared/cta-block';

export const metadata: Metadata = {
  title: 'Terms of Service | TRADINGO',
};

const termsSections = [
  {
    title: '1. Acceptance of Terms',
    content:
      'By accessing or using the TRADINGO platform, you agree to be bound by these Terms of Service. If you do not agree with any part of these terms, you must not use our platform. We reserve the right to update these terms at any time, and continued use of the platform constitutes acceptance of the updated terms.',
    subsections: [],
  },
  {
    title: '2. Account Registration',
    content:
      'To use TRADINGO\'s services, you must create an account and provide accurate, complete information. You are responsible for maintaining the confidentiality of your account credentials and for all activities that occur under your account.',
    subsections: [
      {
        heading: 'Eligibility',
        text: 'You must be at least 18 years old and legally capable of entering into binding contracts. Businesses must provide valid registration documents and GST/PAN details for verification.',
      },
      {
        heading: 'Account Security',
        text: 'You are responsible for safeguarding your password and for any actions taken using your account. Notify us immediately of any unauthorized use of your account.',
      },
      {
        heading: 'Verification',
        text: 'TRADINGO reserves the right to verify the identity and credentials of all users. Failure to complete verification may result in account restrictions or termination.',
      },
    ],
  },
  {
    title: '3. Marketplace Rules',
    content:
      'All users must adhere to marketplace rules designed to ensure fair, transparent, and secure trading. Violation of these rules may result in account suspension or permanent ban.',
    subsections: [
      {
        heading: 'Prohibited Items',
        text: 'Users may not list, buy, or sell items that are illegal, counterfeit, stolen, or prohibited by Indian law. This includes but is not limited to weapons, narcotics, endangered species, and unauthorized financial products.',
      },
      {
        heading: 'Accurate Listings',
        text: 'Sellers must provide accurate, truthful descriptions of products including specifications, condition, pricing, and availability. Misleading or fraudulent listings are strictly prohibited.',
      },
      {
        heading: 'Fair Trading',
        text: 'Users must not engage in price manipulation, bid rigging, fake transactions, or any other practice that undermines the integrity of the marketplace.',
      },
      {
        heading: 'Communication',
        text: 'All communications related to transactions must be conducted through TRADINGO\'s platform. Off-platform communication that circumvents our system is prohibited.',
      },
    ],
  },
  {
    title: '4. Fees & Payments',
    content:
      'TRADINGO charges fees for certain services as described on our pricing page. All fees are disclosed transparently before you commit to a transaction. Payment terms, including escrow arrangements, are governed by these terms.',
    subsections: [
      {
        heading: 'Platform Fees',
        text: 'TRADINGO may charge listing fees, transaction fees, or subscription fees as outlined in the applicable pricing plan. Fees are non-refundable unless otherwise stated.',
      },
      {
        heading: 'Escrow Service',
        text: 'All transactions use our escrow system. Funds are held securely until both parties confirm satisfaction. Escrow release terms are specified in each transaction agreement.',
      },
      {
        heading: 'Taxes',
        text: 'Users are responsible for all applicable taxes, including GST, on transactions conducted through the platform. TRADINGO may be required to collect and remit taxes as per applicable laws.',
      },
      {
        heading: 'GOCASH & Rewards',
        text: 'GOCASH rewards are virtual credits with no monetary value outside the platform. They are non-transferable, non-refundable, and subject to expiration as per the rewards program terms.',
      },
    ],
  },
  {
    title: '5. Intellectual Property',
    content:
      'The TRADINGO platform, including its design, logo, TEM framework, TRADHEXA engines, and all related content, is the intellectual property of TRADINGO Technologies Pvt. Ltd. Users retain ownership of content they post but grant TRADINGO a license to use it for platform operations.',
    subsections: [
      {
        heading: 'Platform IP',
        text: 'All trademarks, service marks, trade names, logos, and domain names owned by TRADINGO are our exclusive property. You may not use them without prior written consent.',
      },
      {
        heading: 'User Content',
        text: 'By posting content on the platform (product listings, reviews, etc.), you grant TRADINGO a non-exclusive, worldwide, royalty-free license to use, reproduce, and display the content for platform operations.',
      },
      {
        heading: 'Restrictions',
        text: 'You may not copy, modify, distribute, reverse engineer, or create derivative works of our platform without explicit permission.',
      },
    ],
  },
  {
    title: '6. Limitation of Liability',
    content:
      'TRADINGO acts as an intermediary platform connecting buyers and sellers. We are not responsible for the quality, safety, or legality of products listed, nor for the conduct of users. Our liability is limited to the maximum extent permitted by law.',
    subsections: [
      {
        heading: 'Platform Role',
        text: 'TRADINGO is a marketplace platform and is not a party to any transaction between buyers and sellers. We do not own, store, or ship any products listed on the platform.',
      },
      {
        heading: 'No Warranties',
        text: 'The platform is provided "as is" without warranties of any kind, either express or implied. We do not guarantee uninterrupted or error-free operation.',
      },
      {
        heading: 'Liability Cap',
        text: 'To the maximum extent permitted by law, TRADINGO\'s total liability for any claim arising from your use of the platform shall not exceed the fees paid by you in the 12 months preceding the claim.',
      },
    ],
  },
  {
    title: '7. Dispute Resolution',
    content:
      'We encourage users to resolve disputes amicably through direct communication. If resolution is not possible, TRADINGO offers a structured dispute resolution process. Unresolved disputes may be referred to arbitration.',
    subsections: [
      {
        heading: 'Internal Resolution',
        text: 'Users may file a dispute through our platform within 7 days of a transaction issue. Our dispute resolution team will review the case and facilitate a fair resolution.',
      },
      {
        heading: 'Mediation',
        text: 'If internal resolution is unsuccessful, both parties agree to participate in mediation conducted by a mutually agreed mediator before pursuing legal action.',
      },
      {
        heading: 'Arbitration',
        text: 'Any dispute not resolved through mediation shall be resolved by binding arbitration in Mumbai, Maharashtra, in accordance with the Arbitration and Conciliation Act, 1996.',
      },
    ],
  },
  {
    title: '8. Termination',
    content:
      'Either party may terminate this agreement at any time. TRADINGO reserves the right to suspend or terminate accounts that violate these terms or engage in fraudulent, abusive, or illegal activity.',
    subsections: [
      {
        heading: 'By User',
        text: 'You may delete your account at any time through your profile settings. Termination does not affect the rights and obligations of parties for transactions already initiated.',
      },
      {
        heading: 'By TRADINGO',
        text: 'We may suspend or terminate accounts for violations of these terms, fraudulent activity, or conduct that harms our platform or community. We will provide notice where practicable.',
      },
      {
        heading: 'Effect of Termination',
        text: 'Upon termination, your right to use the platform ceases immediately. Pending transactions will be handled according to their existing terms. Data will be retained as required by law.',
      },
    ],
  },
  {
    title: '9. Governing Law',
    content:
      'These Terms of Service shall be governed by and construed in accordance with the laws of India. All disputes arising under these terms shall be subject to the exclusive jurisdiction of the courts in Mumbai, Maharashtra.',
    subsections: [
      {
        heading: 'Applicable Law',
        text: 'These terms are governed by the laws of the Republic of India, including the Information Technology Act, 2000, and the Indian Contract Act, 1872.',
      },
      {
        heading: 'Jurisdiction',
        text: 'Any legal action or proceeding arising out of or relating to these terms shall be brought exclusively in the courts located in Mumbai, Maharashtra.',
      },
      {
        heading: 'Severability',
        text: 'If any provision of these terms is found to be unenforceable or invalid, that provision shall be limited or eliminated to the minimum extent necessary, and the remaining provisions shall remain in full force and effect.',
      },
    ],
  },
];

export default function TermsPage() {
  return (
    <>
      <PageHeader
        title="Terms of Service"
        description="The terms and conditions governing your use of the TRADINGO platform."
      />

      <section className="py-12">
        <div className="container-main">
          <div className="mx-auto max-w-3xl">
            <p className="mb-12 text-sm text-text-secondary dark:text-dark-text-secondary">
              Last updated: June 1, 2025
            </p>

            {termsSections.map((section) => (
              <div key={section.title} className="mb-12 last:mb-0">
                <h2 className="mb-4 text-2xl font-bold text-text-primary dark:text-dark-text-primary">
                  {section.title}
                </h2>
                <p className="mb-6 leading-relaxed text-text-secondary dark:text-dark-text-secondary">
                  {section.content}
                </p>
                {section.subsections.length > 0 && (
                  <div className="space-y-6">
                    {section.subsections.map((sub) => (
                      <div key={sub.heading}>
                        <h3 className="mb-2 text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                          {sub.heading}
                        </h3>
                        <p className="leading-relaxed text-text-secondary dark:text-dark-text-secondary">
                          {sub.text}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}

            <p className="mt-16 text-sm text-text-secondary/60 dark:text-dark-text-secondary/60">
              These Terms of Service were last updated on June 1, 2025. Please review them periodically
              for any changes. Continued use of TRADINGO after updates constitutes acceptance of the
              revised terms.
            </p>
          </div>
        </div>
      </section>

      <CTABlock
        title="Ready to Get Started?"
        subtitle="Create your free account and join India's most trusted B2B marketplace."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        variant="simple"
      />
    </>
  );
}
