import type { Metadata } from 'next';
import { PageHeader } from '@/components/shared/page-header';
import { CTABlock } from '@/components/shared/cta-block';

export const metadata: Metadata = {
  title: 'Privacy Policy | TRADINGO',
};

const policySections = [
  {
    title: 'Information We Collect',
    content:
      'We collect information you provide directly to us when you create an account, list products, post RFQs, communicate with other users, or contact our support team. This includes your name, email address, phone number, business details, GST number, PAN, and any other information you choose to provide.',
    subsections: [
      {
        heading: 'Account Information',
        text: 'When you register, we collect your name, email address, phone number, and business details. Sellers are required to provide GST and PAN for verification purposes.',
      },
      {
        heading: 'Transaction Data',
        text: 'We collect information about transactions you conduct on our platform, including product details, pricing, quantities, and payment information. Payment data is processed by our secure payment partners and is not stored on our servers in plain text.',
      },
      {
        heading: 'Usage Data',
        text: 'We automatically collect information about how you interact with our platform, including pages visited, features used, search queries, and time spent on the site. This helps us improve our services.',
      },
      {
        heading: 'Device Information',
        text: 'We collect information about the device you use to access TRADINGO, including IP address, browser type, operating system, and device identifiers.',
      },
    ],
  },
  {
    title: 'How We Use Information',
    content:
      'We use the information we collect to provide, maintain, and improve our platform, process transactions, verify identities, communicate with you, and personalize your experience.',
    subsections: [
      {
        heading: 'Providing Services',
        text: 'To facilitate transactions, verify seller and buyer identities, process payments through escrow, and enable communication between trading partners.',
      },
      {
        heading: 'Platform Improvement',
        text: 'To analyze usage patterns, improve our AI matching algorithms, develop new features, and enhance the overall user experience.',
      },
      {
        heading: 'Communications',
        text: 'To send transaction updates, respond to support inquiries, share platform announcements, and provide personalized recommendations. You can opt out of marketing communications at any time.',
      },
      {
        heading: 'Security & Compliance',
        text: 'To detect and prevent fraud, enforce our Terms of Service, comply with legal obligations, and protect the rights and safety of our users and platform.',
      },
    ],
  },
  {
    title: 'Data Sharing & Disclosure',
    content:
      'We do not sell your personal information to third parties. We may share your information with service providers who help us operate the platform, with trading partners as necessary to complete transactions, or as required by law.',
    subsections: [
      {
        heading: 'Service Providers',
        text: 'We engage trusted third-party service providers for payment processing, KYC verification, cloud hosting, analytics, and customer support. These providers are bound by strict confidentiality agreements.',
      },
      {
        heading: 'Trading Partners',
        text: 'When you engage in a transaction, certain information (such as business name, contact details, and product specifications) is shared with the other party to facilitate the trade.',
      },
      {
        heading: 'Legal Compliance',
        text: 'We may disclose information if required to do so by law or in response to valid legal requests from government authorities.',
      },
    ],
  },
  {
    title: 'Data Security',
    content:
      'We implement industry-standard security measures to protect your information from unauthorized access, alteration, disclosure, or destruction. This includes encryption, firewalls, access controls, and regular security audits.',
    subsections: [
      {
        heading: 'Encryption',
        text: 'All data transmitted between your device and our servers is encrypted using TLS (Transport Layer Security). Sensitive data stored on our servers is encrypted at rest.',
      },
      {
        heading: 'Access Controls',
        text: 'Access to personal information is restricted to authorized personnel who need it to perform their job functions. We conduct regular access reviews and audits.',
      },
      {
        heading: 'Security Audits',
        text: 'We regularly conduct internal and external security audits, vulnerability assessments, and penetration testing to identify and address potential security risks.',
      },
    ],
  },
  {
    title: 'Your Rights',
    content:
      'You have the right to access, correct, update, or delete your personal information. You can manage your account settings directly through your profile or contact us for assistance.',
    subsections: [
      {
        heading: 'Access & Portability',
        text: 'You can request a copy of the personal data we hold about you. We will provide this information in a structured, machine-readable format.',
      },
      {
        heading: 'Correction & Deletion',
        text: 'You can update your account information at any time through your profile settings. You may request deletion of your account and associated data, subject to legal retention requirements.',
      },
      {
        heading: 'Marketing Opt-Out',
        text: 'You can opt out of marketing communications by updating your notification preferences or using the unsubscribe link in our emails.',
      },
    ],
  },
  {
    title: 'Cookies & Tracking',
    content:
      'We use cookies and similar tracking technologies to enhance your experience, analyze usage, and support our marketing efforts. You can control cookie preferences through your browser settings.',
    subsections: [
      {
        heading: 'Essential Cookies',
        text: 'Required for the platform to function properly, including authentication, session management, and security features.',
      },
      {
        heading: 'Analytics Cookies',
        text: 'Help us understand how users interact with our platform, which features are most popular, and where we can improve.',
      },
      {
        heading: 'Preference Cookies',
        text: 'Remember your settings and preferences to provide a personalized experience.',
      },
    ],
  },
  {
    title: 'Changes to This Policy',
    content:
      'We may update this Privacy Policy from time to time. We will notify you of material changes by posting the updated policy on this page and, where appropriate, through email or platform notifications.',
    subsections: [],
  },
  {
    title: 'Contact Us',
    content:
      'If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us at support@tradingo.com or write to us at our Mumbai office.',
    subsections: [],
  },
];

export default function PrivacyPage() {
  return (
    <>
      <PageHeader
        title="Privacy Policy"
        description="How TRADINGO collects, uses, and protects your personal information."
      />

      <section className="py-12">
        <div className="container-main">
          <div className="mx-auto max-w-3xl">
            <p className="mb-12 text-sm text-text-secondary dark:text-dark-text-secondary">
              Last updated: June 1, 2025
            </p>

            {policySections.map((section) => (
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
          </div>
        </div>
      </section>

      <CTABlock
        title="Start Trading with Confidence"
        subtitle="Your privacy and security are our top priorities. Join TRADINGO today and trade with peace of mind."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        variant="simple"
      />
    </>
  );
}
