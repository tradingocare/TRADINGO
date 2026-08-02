'use client';

import Link from 'next/link';
import { Award, Shield, Star, MapPin, Clock, ChevronRight, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
interface ProfessionalCardProps {
  profile?: any;
  slug?: string;
  name?: string;
  title?: string;
  location?: string;
  verified?: boolean;
  plan?: string;
  experience?: string;
  languages?: string[];
  services?: Array<{ name: string; description?: string; price?: string | number }>;
  memberSince?: string;
  avatarInitial?: string;
  trustScore?: number;
}

export function ProfessionalCard(props: ProfessionalCardProps) {
  const src = (props.profile || props) as any;
  const slug = src.slug ?? props.slug ?? '';
  const name = src.name ?? props.name ?? '';
  const title = src.title ?? src.description ?? props.title ?? 'Professional';
  const location = src.location ?? (src.locations?.length ? src.locations[0] : undefined) ?? '';
  const verified = src.verified === true || src.verificationLevel !== 'NONE';
  const plan = src.plan ?? 'individual';
  const experience = src.experience ?? '';
  const languages = src.languages ?? [];
  const services = src.services ?? [];
  const memberSince = src.memberSince ?? '';
  const avatarInitial = src.avatarInitial ?? (name ? name.split(' ').map((n: string) => n[0]).join('') : '?');
  const trustScore = src.trustScore ?? null;

  return (
    <div className="stacked-card-wrapper">
    <Link
      href={`/tradeserv/p/${slug}`}
      className="group block rounded-3xl border border-border compact-stack-card ambient-backlight p-5 transition-all duration-300">
      <div className="mb-3 flex items-start gap-3">
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-sm font-bold text-accent">
          {avatarInitial}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <h3 className="truncate text-sm font-bold text-text-primary group-hover:text-accent transition-colors">
              {name}
            </h3>
            {verified && (
              <Badge variant="warning" className="gap-1 px-2 py-0.5 text-[10px]">
                <Shield className="h-2.5 w-2.5" />
                Verified
              </Badge>
            )}
          </div>
          <p className="mt-0.5 truncate text-xs text-text-secondary">{title}</p>
        </div>
        {trustScore != null && trustScore > 0 && (
          <div className="flex shrink-0 items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-1">
            <CheckCircle className="h-3 w-3 text-emerald-500" />
            <span className="text-[10px] font-bold text-emerald-500">{trustScore}</span>
          </div>
        )}
      </div>

      <div className="mb-3 flex flex-wrap gap-x-3 gap-y-1 text-[11px] text-text-secondary">
        {experience && <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{experience}</span>}
        {location && <span className="flex items-center gap-1"><MapPin className="h-3 w-3" />{location}</span>}
        <Badge variant="outline" className="border-border bg-surface-secondary text-text-secondary px-2 py-0.5 text-[10px]">
          {plan === 'company' ? 'Firm' : 'Individual'}
        </Badge>
      </div>

      {languages.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {languages.slice(0, 3).map((lang: string) => (
            <span key={lang} className="rounded bg-surface-secondary border border-border px-1.5 py-0.5 text-[10px] text-text-secondary">
              {lang}
            </span>
          ))}
          {languages.length > 3 && (
            <span className="rounded bg-surface-secondary border border-border px-1.5 py-0.5 text-[10px] text-text-tertiary">
              +{languages.length - 3}
            </span>
          )}
        </div>
      )}

      {services.length > 0 && (
        <div className="mb-3 space-y-1">
          {services.slice(0, 2).map((svc: any) => (
            <div key={svc.name} className="flex items-center justify-between">
              <span className="text-xs text-text-secondary truncate max-w-[180px]">{svc.name}</span>
              <span className="text-[10px] font-medium text-text-tertiary shrink-0 ml-2">
                {'\u20B9'}{svc.price ?? svc.priceMin ?? ''}
              </span>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between border-t border-border pt-3">
        <div className="flex items-center gap-1.5">
          <Award className="h-3 w-3 text-accent" />
          <span className="text-[10px] font-medium text-text-secondary">
            {memberSince || (trustScore ? `Score: ${trustScore}` : '')}
          </span>
        </div>
        <span className="inline-flex items-center gap-1 text-xs font-medium text-text-tertiary transition-colors group-hover:text-accent">
          View Profile <ChevronRight className="h-3 w-3" />
        </span>
      </div>
    </Link>
    </div>
  );
}
