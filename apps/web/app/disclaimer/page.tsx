import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { CTABlock } from '@/components/shared/cta-block';

export const metadata: Metadata = {
  title: 'Disclaimer | TRADINGO',
  description: 'TRADINGO Disclaimer outlines limitations of liability, no warranty provisions, and terms governing use of India\'s first Trusted Electronic Marketplace.',
  openGraph: {
    title: 'Disclaimer | TRADINGO',
    description: 'Read TRADINGO\'s disclaimer regarding platform warranties, third-party content, and limitation of liability.',
    type: 'website',
    siteName: 'TRADINGO',
  },
};

const disclaimerSections = [
  {
    title: 'General Information Only',
    content: 'The information provided on the TRADINGO platform is for general informational and business matching purposes only. While we strive to keep the information accurate and up-to-date, we make no representations or warranties of any kind, express or implied, about the completeness, accuracy, reliability, suitability, or availability of the platform or the information, products, services, or related graphics contained on the platform for any purpose.',
    subsections: [],
  },
  {
    title: 'No Warranty',
    content: 'TRADINGO provides the platform on an "as is" and "as available" basis. We expressly disclaim all warranties of any kind, whether express or implied, including but not limited to the implied warranties of merchantability, fitness for a particular purpose, title, and non-infringement. We do not warrant that the platform will be uninterrupted, timely, secure, or error-free, or that any defects will be corrected.',
    subsections: [],
  },
  {
    title: 'Third-Party Content & Listings',
    content: 'TRADINGO acts solely as an intermediary connecting buyers and sellers. We do not endorse, guarantee, or warrant any products, services, listings, or content provided by third-party users of the platform. All product listings, descriptions, pricing, and representations are the sole responsibility of the sellers who post them. Buyers are advised to conduct their own due diligence before entering into any transaction.',
    subsections: [
      {
        heading: 'User-Generated Content',
        text: 'We are not responsible for the accuracy, legality, or quality of user-generated content, including product listings, reviews, RFQs, and communications. Users are solely responsible for the content they post.',
      },
      {
        heading: 'Third-Party Links',
        text: 'The platform may contain links to third-party websites or services that are not owned or controlled by TRADINGO. We have no control over, and assume no responsibility for, the content, privacy policies, or practices of any third-party websites.',
      },
    ],
  },
  {
    title: 'Limitation of Liability',
    content: 'To the maximum extent permitted by applicable law, TRADINGO Technologies Pvt. Ltd., its directors, employees, partners, and affiliates shall not be liable for any indirect, incidental, special, consequential, or punitive damages, including but not limited to loss of profits, data, use, goodwill, or other intangible losses, resulting from your access to or use of or inability to access or use the platform, any conduct or content of any third party on the platform, or any unauthorized access, use, or alteration of your transmissions or content.',
    subsections: [],
  },
  {
    title: 'Professional Advice Disclaimer',
    content: 'Nothing on the TRADINGO platform constitutes professional, legal, financial, or tax advice. Users should consult appropriate professional advisors for advice regarding their individual situations. Trade, pricing, and market information provided on the platform is for reference purposes only and should not be relied upon for business decisions without independent verification.',
    subsections: [],
  },
  {
    title: 'Forward-Looking Statements',
    content: 'Any statements regarding TRADINGO\'s growth, market position, future features, or projected metrics are forward-looking statements based on current expectations. Actual results may differ materially. We undertake no obligation to update any forward-looking statements to reflect events or circumstances after the date of such statements.',
    subsections: [],
  },
];

export default function DisclaimerPage() {
  return (
    <>
      <PageHeader
        title="Disclaimer"
        description="Limitations of liability and important notices regarding the use of the TRADINGO platform."
      />

      <section className="border-b border-border bg-bg-base py-16">
        <div className="container-main max-w-4xl">
          <div className="rounded-2xl border border-border bg-surface p-8 sm:p-12">
            <div className="prose prose-invert max-w-none">
              <p className="mb-8 text-sm text-text-tertiary">
                Last Updated: July 21, 2026
              </p>

              {disclaimerSections.map((section) => (
                <div key={section.title} className="mb-8">
                  <h2 className="mb-4 text-xl font-bold text-text-primary">
                    {section.title}
                  </h2>
                  <p className="mb-4 leading-relaxed text-text-secondary">
                    {section.content}
                  </p>
                  {section.subsections?.map((sub) => (
                    <div key={sub.heading} className="mb-3 ml-4 border-l-2 border-border pl-4">
                      <h3 className="mb-2 text-base font-semibold text-text-primary">
                        {sub.heading}
                      </h3>
                      <p className="text-sm leading-relaxed text-text-secondary">
                        {sub.text}
                      </p>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <CTABlock
        title="Have Questions?"
        subtitle="Contact our support team for clarification on any of our policies."
        primaryLabel="Contact Us"
        primaryHref="/contact"
        secondaryLabel="Back to Home"
        secondaryHref="/"
      />
    </>
  );
}
