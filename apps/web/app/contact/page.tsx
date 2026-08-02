'use client';

import { Mail, Phone, MapPin, Clock, MessageSquare, Headphones, CheckCircle2, AlertCircle } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { Separator } from '@/components/ui/separator';
import { CONTACT_METHODS, BUSINESS_HOURS } from '@/data/master-data';
import { useState, FormEvent } from 'react';

const iconMap: Record<string, React.ElementType> = { Mail, Phone, MapPin };
const contactMethods = CONTACT_METHODS.map((m) => ({ ...m, icon: iconMap[m.icon] }));

const businessHours = BUSINESS_HOURS;

export default function ContactPage() {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '', website: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setStatus('loading');
    setErrorMsg('');

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';
      const res = await fetch(`${apiUrl}/public/crm`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ message: 'Submission failed' }));
        throw new Error(err.message || err.error || 'Submission failed');
      }

      setStatus('success');
      setFormData({ name: '', email: '', subject: '', message: '', website: '' });
    } catch (err) {
      setStatus('error');
      setErrorMsg((err as Error).message);
    }
  };

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
                  <div className="flex h-full flex-col items-center rounded-xl border border-border bg-surface p-8 text-center shadow-sm transition-shadow hover:shadow-md">
                    <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-accent/10 text-accent">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mt-4 text-lg font-semibold text-text-primary">{method.label}</h3>
                    {method.href ? (
                      <a
                        href={method.href}
                        className="mt-2 text-base font-medium text-accent hover:text-accent-dark"
                      >
                        {method.value}
                      </a>
                    ) : (
                      <p className="mt-2 text-base font-medium text-text-primary">{method.value}</p>
                    )}
                    <p className="mt-2 text-sm text-text-secondary">{method.description}</p>
                  </div>
                </AnimatedSection>
              );
            })}
          </div>
        </div>
      </section>

      <Separator />

      {/* Contact Form */}
      <section className="py-20">
        <div className="container-main">
          <div className="mx-auto grid max-w-5xl gap-12 lg:grid-cols-2">
            <AnimatedSection>
              <SectionHeader
                title="Send Us a Message"
                subtitle="Fill out the form and our team will get back to you within 24 hours."
                align="left"
              />
              {status === 'success' ? (
                <div className="mt-8 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 className="h-6 w-6 text-emerald-400" />
                    <p className="font-medium text-text-primary">Message sent successfully!</p>
                  </div>
                  <p className="mt-2 text-sm text-text-secondary">
                    Thank you for reaching out. Our team will get back to you within 24 hours.
                  </p>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-8 space-y-5">
                  {/* Honeypot — hidden from users, bots fill it */}
                  <div className="absolute -left-[9999px]" aria-hidden="true">
                    <label htmlFor="website">Website</label>
                    <input
                      id="website"
                      name="website"
                      type="text"
                      value={formData.website}
                      onChange={(e) => setFormData((prev) => ({ ...prev, website: e.target.value }))}
                      tabIndex={-1}
                      autoComplete="off"
                    />
                  </div>

                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="name" className="block text-sm font-medium text-text-primary">
                        Full Name <span className="text-status-error">*</span>
                      </label>
                      <input
                        id="name"
                        type="text"
                        required
                        value={formData.name}
                        onChange={(e) => setFormData((prev) => ({ ...prev, name: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="Your name"
                      />
                    </div>
                    <div>
                      <label htmlFor="email" className="block text-sm font-medium text-text-primary">
                        Email Address <span className="text-status-error">*</span>
                      </label>
                      <input
                        id="email"
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData((prev) => ({ ...prev, email: e.target.value }))}
                        className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="you@example.com"
                      />
                    </div>
                  </div>
                  <div>
                    <label htmlFor="subject" className="block text-sm font-medium text-text-primary">
                      Subject <span className="text-status-error">*</span>
                    </label>
                    <input
                      id="subject"
                      type="text"
                      required
                      value={formData.subject}
                      onChange={(e) => setFormData((prev) => ({ ...prev, subject: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      placeholder="How can we help?"
                    />
                  </div>
                  <div>
                    <label htmlFor="message" className="block text-sm font-medium text-text-primary">
                      Message <span className="text-status-error">*</span>
                    </label>
                    <textarea
                      id="message"
                      required
                      rows={5}
                      value={formData.message}
                      onChange={(e) => setFormData((prev) => ({ ...prev, message: e.target.value }))}
                      className="mt-1 block w-full rounded-lg border border-border bg-surface px-4 py-2.5 text-text-primary placeholder:text-text-secondary/50 focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 resize-y"
                      placeholder="Tell us more about your query..."
                    />
                  </div>

                  {status === 'error' && (
                    <div className="flex items-center gap-2 rounded-lg border border-status-error/30 bg-status-error/10 p-3 text-sm text-status-error">
                      <AlertCircle className="h-4 w-4 flex-shrink-0" />
                      {errorMsg}
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={status === 'loading'}
                    className="inline-flex items-center gap-2 rounded-lg bg-gradient-to-br from-accent-500 to-accent-400 px-6 py-3 text-sm font-semibold text-btn-primary-text transition-colors hover:from-accent-400 hover:to-accent-500 focus:outline-none focus:ring-2 focus:ring-accent/20 disabled:opacity-50"
                  >
                    <MessageSquare className="h-4 w-4" />
                    {status === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </form>
              )}
            </AnimatedSection>
            <AnimatedSection delay={150}>
              <div className="flex h-full flex-col justify-center">
                <div className="rounded-xl border border-border bg-surface p-8 shadow-sm">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-accent/10 text-accent">
                    <Headphones className="h-6 w-6" />
                  </div>
                  <h3 className="text-xl font-bold text-text-primary">Prefer to talk?</h3>
                  <p className="mt-2 text-text-secondary">
                    Our support team is available 24/7 to assist you with any questions or concerns.
                    For urgent matters, we recommend calling our helpline for the fastest response.
                  </p>
                  <div className="mt-6 space-y-3">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-accent" />
                      <a href="tel:+91180087234646" className="text-sm font-medium text-accent hover:text-accent-dark">
                        +91 1800-TRADINGO
                      </a>
                    </div>
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-accent" />
                      <a href="mailto:support@tradingo.com" className="text-sm font-medium text-accent hover:text-accent-dark">
                        support@tradingo.com
                      </a>
                    </div>
                    <div className="flex items-start gap-3">
                      <MapPin className="mt-0.5 h-5 w-5 text-accent" />
                      <div>
                        <p className="text-sm text-text-secondary">TRADINGO Technologies Pvt. Ltd.</p>
                        <p className="text-sm text-text-secondary">BKC, Mumbai 400051</p>
                        <p className="text-sm text-text-secondary">Maharashtra, India</p>
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
              <div className="mx-auto max-w-md rounded-xl border border-border bg-surface p-8 shadow-sm">
                <div className="mb-4 flex justify-center">
                  <Clock className="h-8 w-8 text-accent" />
                </div>
                <div className="space-y-4">
                  {businessHours.map((item) => (
                    <div key={item.day} className="flex items-center justify-between border-b border-border pb-3 last:border-0 last:pb-0">
                      <span className="font-medium text-text-primary">{item.day}</span>
                      <span className="text-sm text-text-secondary">{item.hours}</span>
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
