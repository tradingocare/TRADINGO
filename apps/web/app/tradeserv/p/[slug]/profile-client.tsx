'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  MapPin, Briefcase, Award, BookOpen, Globe, CheckCircle,
  ArrowLeft, Shield, Star, Clock, Send, Mail, Phone, ExternalLink, Users,
} from 'lucide-react';
import { useProfessionalProfile } from '@/hooks/use-tradeserv';
import { AnimatedSection } from '@/components/shared/animated-section';
import { InquiryModal } from '@/components/tradeserv/inquiry-modal';
import { BusinessCard } from '@/components/tradeserv/business-card';
import { ProfileShare } from '@/components/tradeserv/profile-share';
import { AiProfileSummary } from '@/components/tradeserv/ai-profile-summary';
import { PortfolioGallery } from '@/components/tradeserv/portfolio-gallery';
import { RelatedProfessionals } from '@/components/tradeserv/related-professionals';
import { StarRating } from '@/components/tradeserv/star-rating';

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-surface p-5 sm:p-6">
      <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">{title}</h3>
      {children}
    </div>
  );
}

export default function ProfileClient() {
  const params = useParams();
  const slug = params.slug as string;
  const { data: profile, isLoading, error } = useProfessionalProfile(slug);
  const [showInquiry, setShowInquiry] = useState(false);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="flex items-center gap-3">
          <div className="h-6 w-6 animate-spin rounded-full border-2 border-accent border-t-transparent" />
          <span className="text-sm text-text-tertiary">Loading profile...</span>
        </div>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg-base">
        <div className="text-center px-4">
          <p className="text-6xl font-bold text-accent">404</p>
          <p className="mt-4 text-lg text-text-tertiary">Profile not found</p>
          <p className="mt-2 text-sm text-text-tertiary">This professional profile does not exist or has not been published yet.</p>
          <Link
            href="/tradeserv"
            className="mt-8 inline-flex items-center gap-2 rounded-xl bg-accent px-6 py-3 text-sm font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
          >
            Back to TradeServ
            <ArrowLeft size={16} />
          </Link>
        </div>
      </div>
    );
  }

  const name = profile.name ?? 'Professional';
  const title = profile.description ?? profile.professionalType ?? 'TradeServ Professional';
  const location = profile.locations?.length ? profile.locations.join(', ') : '';
  const email = profile.email ?? '';
  const mobile = profile.mobile ?? '';
  const trustScore = profile.trustScore ?? 0;
  const verificationLevel = profile.verificationLevel ?? '';
  const professionalStatus = profile.professionalStatus ?? '';
  const services = profile.professionalServices ?? [];
  const portfolio = profile.professionalPortfolio ?? [];
  const certifications = profile.professionalCertifications ?? [];
  const languages = profile.professionalLanguages ?? [];
  const serviceAreas = profile.professionalServiceAreas ?? [];
  const reviews = profile.reviewsAsProfessional ?? [];
  const website = profile.website ?? '';
  const socialLinks = profile.socialLinks ?? {};
  const avatarInitial = name.split(' ').map((n: string) => n[0]).join('').slice(0, 2).toUpperCase();

  const qualifications = profile.qualifications ?? [];
  const isVerified = professionalStatus === 'APPROVED';
  const avgRating = reviews.length
    ? (reviews.reduce((sum: number, r: any) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  return (
    <div className="min-h-screen bg-bg-base">
      <div
        className="pointer-events-none fixed inset-0"
        style={{ background: 'radial-gradient(ellipse 80% 60% at 50% -20%, rgba(245, 158, 11, 0.06), transparent)' }}
      />
      <div className="relative z-10 py-8 sm:py-12">
        <div className="container-main max-w-5xl">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.4 }}>
            <Link
              href="/tradeserv/search"
              className="mb-6 inline-flex items-center gap-2 text-sm text-text-tertiary transition-colors hover:text-accent"
            >
              <ArrowLeft size={14} />
              Back to search
            </Link>
          </motion.div>

          <div className="grid gap-8 lg:grid-cols-3">
            <div className="lg:col-span-2 space-y-6">
              {/* Header */}
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
                <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
                  <div className="flex flex-col items-start gap-5 sm:flex-row sm:items-center">
                    <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-accent/10 text-2xl font-bold text-accent sm:h-24 sm:w-24 sm:text-3xl">
                      {avatarInitial}
                    </div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-3">
                        <h1 className="text-2xl font-bold text-text-primary sm:text-3xl">{name}</h1>
                        {isVerified && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-3 py-0.5 text-[10px] font-semibold text-accent">
                            <Shield size={10} />
                            Verified
                          </span>
                        )}
                      </div>
                      <p className="mt-1 text-base text-text-tertiary">{title}</p>
                      <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-text-tertiary">
                        {location && <span className="flex items-center gap-1"><MapPin size={12} /> {location}</span>}
                        {trustScore > 0 && <span className="flex items-center gap-1"><Star size={12} /> Trust Score: {trustScore}</span>}
                        {avgRating && <span className="flex items-center gap-1"><Star size={12} /> {avgRating} ({reviews.length} reviews)</span>}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* AI Summary */}
              <AnimatedSection>
                <Section title="Professional Summary">
                  <AiProfileSummary
                    name={name}
                    title={title}
                    bio={profile.description || ''}
                    services={services}
                    qualifications={qualifications}
                  />
                  {!profile.description && !services.length && (
                    <p className="text-sm leading-relaxed text-text-tertiary">
                      This professional has not completed their profile yet.
                    </p>
                  )}
                  {profile.description && (
                    <p className="mt-3 text-sm leading-relaxed text-text-tertiary">{profile.description}</p>
                  )}
                </Section>
              </AnimatedSection>

              {/* Services */}
              {services.length > 0 && (
                <AnimatedSection>
                  <Section title="Services & Pricing">
                    <div className="space-y-3">
                      {services.map((s: any) => (
                        <div key={s.id} className="flex items-start justify-between rounded-lg border border-border bg-surface p-4">
                          <div>
                            <p className="text-sm font-medium text-text-primary">{s.name}</p>
                            {s.description && <p className="mt-0.5 text-xs text-text-tertiary">{s.description}</p>}
                            {s.deliveryDays && <p className="mt-1 text-[10px] text-text-tertiary">Delivery: {s.deliveryDays} days</p>}
                          </div>
                          {(s.priceMin != null || s.priceMax != null) && (
                            <span className="shrink-0 text-sm font-semibold text-accent ml-3">
                              {'\u20B9'}{s.priceMin?.toLocaleString() ?? ''}{s.priceMax ? ` - ${s.priceMax.toLocaleString()}` : ''}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </Section>
                </AnimatedSection>
              )}

              {/* Portfolio Gallery */}
              {portfolio.length > 0 && (
                <AnimatedSection>
                  <Section title="Portfolio">
                    <PortfolioGallery items={portfolio} />
                  </Section>
                </AnimatedSection>
              )}

              {/* Certifications */}
              {certifications.length > 0 && (
                <AnimatedSection>
                  <Section title="Certifications">
                    <div className="space-y-3">
                      {certifications.map((c: any) => (
                        <div key={c.id} className="flex items-start gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-purple-500/10">
                            <Award size={14} className="text-purple-400" />
                          </div>
                          <div>
                            <p className="text-sm font-medium text-text-primary">{c.name}</p>
                            <p className="text-xs text-text-tertiary">
                              {c.issuingAuthority}
                              {c.issueDate && <> &middot; {new Date(c.issueDate).getFullYear()}</>}
                              {c.verificationStatus === 'VERIFIED' && (
                                <span className="ml-2 inline-flex items-center gap-0.5 text-emerald-500">
                                  <CheckCircle size={10} /> Verified
                                </span>
                              )}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </Section>
                </AnimatedSection>
              )}

              {/* Reviews */}
              {reviews.length > 0 && (
                <AnimatedSection>
                  <Section title={`Client Reviews (${reviews.length})`}>
                    <div className="space-y-4">
                      {reviews.slice(0, 5).map((r: any) => (
                        <div key={r.id} className="rounded-lg border border-border bg-surface p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center gap-2">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-surface-secondary text-xs font-bold text-text-secondary">
                                {r.client?.name?.split(' ').map((n: string) => n[0]).join('') || '?'}
                              </div>
                              <div>
                                <p className="text-xs font-medium text-text-primary">{r.client?.name || 'Anonymous'}</p>
                                <StarRating rating={r.rating} />
                              </div>
                            </div>
                            {r.isVerifiedBooking && (
                              <CheckCircle size={12} className="text-emerald-500 shrink-0" />
                            )}
                          </div>
                          {r.title && <p className="mt-2 text-xs font-medium text-text-primary">{r.title}</p>}
                          {r.description && <p className="mt-1 text-xs text-text-tertiary">{r.description}</p>}
                        </div>
                      ))}
                    </div>
                  </Section>
                </AnimatedSection>
              )}
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Quick Info */}
              <AnimatedSection delay={100}>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Quick Info</h3>
                  <div className="space-y-3">
                    {website && (
                      <div className="flex items-center gap-3">
                        <Globe size={14} className="text-text-tertiary" />
                        <a href={website} target="_blank" rel="noopener noreferrer"
                          className="text-xs text-accent hover:text-accent/80 truncate">
                          {website.replace(/^https?:\/\//, '')}
                        </a>
                      </div>
                    )}
                    {languages.length > 0 && (
                      <div className="flex items-center gap-3">
                        <Globe size={14} className="text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Languages</p>
                          <p className="text-xs text-text-secondary">
                            {languages.map((l: any) => l.language).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    {serviceAreas.length > 0 && (
                      <div className="flex items-center gap-3">
                        <MapPin size={14} className="text-text-tertiary" />
                        <div>
                          <p className="text-xs text-text-tertiary">Service Areas</p>
                          <p className="text-xs text-text-secondary">
                            {serviceAreas.map((a: any) => a.city).join(', ')}
                          </p>
                        </div>
                      </div>
                    )}
                    <div className="flex items-center gap-3">
                      <Briefcase size={14} className="text-text-tertiary" />
                      <div>
                        <p className="text-xs text-text-tertiary">Professional Type</p>
                        <p className="text-xs text-text-secondary capitalize">
                          {profile.professionalType?.replace(/_/g, ' ') || 'Professional'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Trust Score */}
              <AnimatedSection delay={150}>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">TradTrust Score</h3>
                  <div className="flex items-center gap-3">
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10">
                      <span className="text-lg font-bold text-accent">{trustScore > 0 ? trustScore : '--'}</span>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-text-secondary">
                        {isVerified ? 'Verified Professional' : verificationLevel || 'Verification Pending'}
                      </p>
                      {isVerified && (
                        <div className="mt-1 flex items-center gap-1">
                          <CheckCircle size={10} className="text-emerald-500" />
                          <span className="text-[10px] text-emerald-500/80">TradTrust Certified</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </AnimatedSection>

              {/* Business Card + Share */}
              <AnimatedSection delay={180}>
                <div className="rounded-xl border border-border bg-surface p-5">
                  <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Connect</h3>
                  <div className="space-y-2">
                    <BusinessCard name={name} title={title} location={location} email={email} mobile={mobile} slug={slug} />
                    <ProfileShare name={name} slug={slug} />
                  </div>
                </div>
              </AnimatedSection>

              {/* Contact Info */}
              {(email || mobile) && (
                <AnimatedSection delay={200}>
                  <div className="rounded-xl border border-border bg-surface p-5">
                    <h3 className="mb-4 text-xs font-semibold uppercase tracking-wider text-text-tertiary">Contact</h3>
                    <div className="space-y-3">
                      {email && (
                        <a href={`mailto:${email}`}
                          className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors">
                          <Mail size={14} /> {email}
                        </a>
                      )}
                      {mobile && (
                        <a href={`tel:${mobile}`}
                          className="flex items-center gap-2 text-xs text-accent hover:text-accent/80 transition-colors">
                          <Phone size={14} /> {mobile}
                        </a>
                      )}
                    </div>
                  </div>
                </AnimatedSection>
              )}

              {/* Inquiry CTA */}
              <AnimatedSection delay={250}>
                <div className="rounded-xl border border-accent/20 bg-accent/[0.04] p-5">
                  <h3 className="text-xs font-semibold text-accent">Interested in working with {name.split(' ')[0]}?</h3>
                  <p className="mt-2 text-[11px] text-text-tertiary leading-relaxed">
                    TradeServ connects you directly with verified professionals. Send an inquiry to start the conversation.
                  </p>
                  <button
                    onClick={() => setShowInquiry(true)}
                    className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 py-2.5 text-xs font-semibold text-btn-primary-text transition-all hover:bg-accent/90"
                  >
                    <Send size={14} />
                    Send Inquiry
                  </button>
                </div>
              </AnimatedSection>
            </div>
          </div>

          {/* Related Professionals */}
          <div className="mt-8">
            <RelatedProfessionals currentSlug={slug} />
          </div>
        </div>
      </div>

      <InquiryModal
        open={showInquiry}
        onClose={() => setShowInquiry(false)}
        professionalName={name}
        professionalSlug={slug}
      />
    </div>
  );
}
