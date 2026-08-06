import { PageHeader } from '@/components/shared/page-header'

const cookiesSections = [
  {
    title: '1. What Are Cookies',
    content: 'Cookies are small text files stored on your device when you visit a website. They help TRADINGO remember your preferences, improve site performance, and provide personalised content and advertisements.',
    subsections: [],
  },
  {
    title: '2. Types of Cookies We Use',
    content: 'TRADINGO uses the following categories of cookies:',
    subsections: [
      { heading: 'Essential Cookies', text: 'Required for platform functionality — authentication, session management, security. These cannot be disabled.' },
      { heading: 'Functional Cookies', text: 'Remember your preferences — language, currency, saved items, and dashboard layout.' },
      { heading: 'Analytics Cookies', text: 'Help us understand platform usage — pages visited, features used, search behaviour. Data is aggregated and anonymised.' },
      { heading: 'Advertising Cookies', text: 'Used to deliver relevant ads and measure campaign performance. These are only set with your explicit consent.' },
    ],
  },
  {
    title: '3. Third-Party Cookies',
    content: 'We partner with trusted service providers who may set cookies on your device:',
    subsections: [
      { heading: 'Google Analytics', text: 'Tracks anonymised usage patterns to help us improve the platform.' },
      { heading: 'Razorpay', text: 'Payment processing cookies essential for transaction security and fraud prevention.' },
      { heading: 'Sentry', text: 'Error tracking cookies used only when an error occurs, for debugging purposes.' },
      { heading: 'Social Media', text: 'If you share content via social platforms, they may set cookies governed by their own policies.' },
    ],
  },
  {
    title: '4. Managing Cookies',
    content: 'You can control cookie preferences through your browser settings:',
    subsections: [
      { heading: 'Browser Controls', text: 'Most browsers allow you to view, block, or delete cookies via Settings > Privacy & Security.' },
      { heading: 'Cookie Banner', text: 'On your first visit, our cookie consent banner lets you accept or reject non-essential cookies.' },
      { heading: 'Opt Out', text: 'You may withdraw consent at any time by clearing cookies via browser settings.' },
    ],
  },
  {
    title: '5. Data Protection',
    content: 'Cookies do not store sensitive personal information. All cookie data is handled in accordance with our Privacy Policy and applicable data protection laws including GDPR and CCPA.',
    subsections: [],
  },
  {
    title: '6. Updates to This Policy',
    content: 'We may update this Cookie Policy as our platform evolves. Changes will be posted on this page with an updated effective date. Continued use of TRADINGO after changes constitutes acceptance of the updated policy.',
    subsections: [],
  },
]

export default function CookiesPage() {
  return (
    <div className="min-h-screen bg-bg-base">
      <PageHeader
        title="Cookie Policy"
        description="How TRADINGO uses cookies and similar technologies"
      />
      <section className="mx-auto max-w-4xl px-4 py-12">
        <div className="rounded-xl border border-border bg-surface p-8">
          <p className="mb-8 text-sm text-text-tertiary">Effective Date: July 1, 2025</p>
          {cookiesSections.map((section) => (
            <div key={section.title} className="mb-8 last:mb-0">
              <h2 className="mb-3 text-lg font-bold text-text-primary">{section.title}</h2>
              <p className="mb-3 text-sm leading-relaxed text-text-secondary">{section.content}</p>
              {section.subsections.length > 0 && (
                <div className="ml-4 space-y-3">
                  {section.subsections.map((sub) => (
                    <div key={sub.heading}>
                      <h3 className="text-sm font-semibold text-text-primary">{sub.heading}</h3>
                      <p className="text-sm leading-relaxed text-text-secondary">{sub.text}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  )
}
