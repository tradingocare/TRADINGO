import type { Metadata } from 'next';
import { Mail, Phone, MapPin, Clock, MessageSquare, Headphones } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Contact Us | TRADINGO',
};

const contactMethods = [
  {
    icon: Mail,
    label: 'Email',
    value: 'support@tradingo.com',
    href: 'mailto:support@tradingo.com',
    description: 'Send us an email anytime. We typically respond within 24 hours.',
  },
  {
    icon: Phone,
    label: 'Phone',
    value: '+91 1800-TRADINGO',
    href: 'tel:+91180087234646',
    description: 'Call our support team. Available Monday to Saturday, 9 AM to 9 PM.',
  },
  {
    icon: MapPin,
    label: 'Office Address',
    value: 'Mumbai, Maharashtra, India',
    href: null,
    description: 'TRADINGO Technologies Pvt. Ltd., BKC, Mumbai 400051.',
  },
];

const businessHours = [
  { day: 'Monday - Saturday', hours: '9:00 AM - 9:00 PM IST' },
  { day: 'Sunday', hours: '10:00 AM - 6:00 PM IST' },
  { day: 'Public Holidays', hours: 'Limited support (10 AM - 4 PM IST)' },
];

export default function ContactPage() {
  return (
    <>
      <PageHeader
        title="Contact TRADINGO"
        description="Get in touch with our team. We're here to help."
      />

      {/* Contact Info Cards */}
      <section className="py-20">
        <div className="container-main">
          <div className="mx-auto grid max-w-5xl gap-8 md:grid-cols-3">
            {contactMethods.map((method, i) => {
              const Icon = method.icon;
              return (
                <AnimatedSection key={method.label} delay={i * 100}>
                  <div className="flex h-full flex-col items-center rounded-xl border border-border bg-surface p-8 text-center shadow-sm transition-shadow hover:shadow-md dark:bg-dark-surface dark:border-dark-border">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-text-primary dark:text-dark-text-primary">{method.label}</h3>
                    {method.href ? (
                      <a
                        href={method.href}
                        className="mt-2 text-base font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                      >
                        {method.value}
                      </a>
                    ) : (
                      <p className="mt-2 text-base font-medium text-text-primary dark:text-dark-text-primary">{method.value}</p>
                    )}
                    <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{method.description}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact Form */}
      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            <AnimatedSection>
              <SectionHeader
                title="Send Us a Message"
                subtitle="Fill out the form and our team will get back to you within 24 hours."
                align="left"
              />
              <form className="mt-8 space-y-5">
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="name" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      Full Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="name"
                      type="text"
                      required
                      className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary"
                      placeholder="Your name"
                    />
                  </div>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                      Email Address <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      type="email"
                      required
                      className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary"
                      placeholder="you@example.com"
                    />
                  </div>
                </div>
                <div>
                  <label htmlFor="subject" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    Subject <span className="text-red-500">*</span>
                  </label>
                  <input
                    id="subject"
                    type="text"
                    required
                    className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary"
                    placeholder="How can we help?"
                  />
                </div>
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-text-primary dark:text-dark-text-primary">
                    Message <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-500/20 dark:bg-dark-surface dark:border-dark-border dark:text-dark-text-primary resize-y"
                    placeholder="Tell us more about your query..."
                  />
                </div>
                <button
                  type="submit"
                  className="inline-flex items-center gap-2 rounded-lg bg-primary-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-primary-500/20"
                >
                  <MessageSquare className="h-4 w-4" />
                  Send Message
                </button>
              </form>
            </AnimatedSection>
            <AnimatedSection delay={150}>
              <div className="flex h-full flex-col justify-center">
                <div className="rounded-xl border border-border bg-surface p-8 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent-50 text-accent-600 dark:bg-accent-900/30 dark:text-accent-400">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Prefer to talk?</h3>
                  <p className="mt-2 text-text-secondary dark:text-dark-text-secondary">
                    Our support team is available 24/7 to assist you with any questions or concerns.
                    For urgent matters, we recommend calling our helpline for the fastest response.
                  </p>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <a href="tel:+91180087234646" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        +91 1800-TRADINGO
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <a href="mailto:support@tradingo.com" className="text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400">
                        support@tradingo.com
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-primary-600 dark:text-primary-400" />
                      <div>
                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">TRADINGO Technologies Pvt. Ltd.</p>
                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">BKC, Mumbai 400051</p>
                        <p className="text-sm text-text-secondary dark:text-dark-text-secondary">Maharashtra, India</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      <Separator />

      {/* Business Hours */}
      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <div className="mx-auto max-w-3xl text-center">
              <SectionHeader
                title="Business Hours"
                subtitle="Our team is available during the following hours."
              />
              <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm dark:bg-dark-surface dark:border-dark-border">
                <div className="mb-4 flex justify-center">
                  <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
                </div>
                <div className="space-y-4">
                  {businessHours.map((item) => (
                    <div key={item.day} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0 dark:border-dark-border">
                      <span className="font-medium text-text-primary dark:text-dark-text-primary">{item.day}</span>
                      <span className="text-sm text-text-secondary dark:text-dark-text-secondary">{item.hours}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* CTA */}
      <CTABlock
        title="Start Trading Today"
        subtitle="Join thousands of businesses already trading on TRADINGO. Create your free account in minutes."
        primaryLabel="Create Free Account"
        primaryHref="/register"
        secondaryLabel="Explore Marketplace"
        secondaryHref="/trading"
        variant="accent"
      />
    </>
  );
}
