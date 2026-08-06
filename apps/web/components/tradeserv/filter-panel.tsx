'use client';

import { X, Star, Clock, Globe, Shield, Briefcase, ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FilterState {
  tradtrust: string;
  experience: string;
  rating: string;
  languages: string[];
  availability: string;
  membership: string;
  verification: string;
}

interface FilterPanelProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  onReset: () => void;
}

const EXPERIENCE_OPTIONS = ['All', '0-3 Years', '3-5 Years', '5-10 Years', '10-15 Years', '15+ Years'];
const RATING_OPTIONS = ['All', '4.5+ Stars', '4.0+ Stars', '3.5+ Stars'];
const LANGUAGE_OPTIONS = ['English', 'Hindi', 'Marathi', 'Gujarati', 'Tamil', 'Telugu', 'Kannada', 'Punjabi', 'French'];
const AVAILABILITY_OPTIONS = ['All', 'Available Now', 'Within 24 Hours', 'Within 1 Week'];
const MEMBERSHIP_OPTIONS = ['All', 'Trade Smart', 'Trade Plus', 'Trade Pro'];
const TRUST_OPTIONS = ['All', 'Verified Only'];

export function FilterPanel({ filters, onChange, onReset }: FilterPanelProps) {
  const hasActiveFilters = Object.values(filters).some((v) => {
    if (Array.isArray(v)) return v.length > 0;
    return v !== 'All' && v !== '';
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-text-tertiary">Filters</h3>
        {hasActiveFilters && (
          <button
            type="button"
            onClick={onReset}
            className="text-xs text-accent hover:text-accent transition-colors"
          >
            Clear All
          </button>
        )}
      </div>

      {/* TradTrust / Verification */}
      <FilterSection icon={Shield} title="Verification">
        <div className="flex flex-wrap gap-1.5">
          {TRUST_OPTIONS.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={filters.tradtrust === opt}
              onClick={() => onChange({ ...filters, tradtrust: opt })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Experience */}
      <FilterSection icon={Clock} title="Experience">
        <div className="flex flex-wrap gap-1.5">
          {EXPERIENCE_OPTIONS.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={filters.experience === opt}
              onClick={() => onChange({ ...filters, experience: opt })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Rating */}
      <FilterSection icon={Star} title="Rating">
        <div className="flex flex-wrap gap-1.5">
          {RATING_OPTIONS.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={filters.rating === opt}
              onClick={() => onChange({ ...filters, rating: opt })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Languages */}
      <FilterSection icon={Globe} title="Languages">
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGE_OPTIONS.map((lang) => {
            const isActive = filters.languages.includes(lang);
            return (
              <FilterChip
                key={lang}
                label={lang}
                active={isActive}
                onClick={() => {
                  const next = isActive
                    ? filters.languages.filter((l) => l !== lang)
                    : [...filters.languages, lang];
                  onChange({ ...filters, languages: next });
                }}
              />
            );
          })}
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection icon={Briefcase} title="Availability">
        <div className="flex flex-wrap gap-1.5">
          {AVAILABILITY_OPTIONS.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={filters.availability === opt}
              onClick={() => onChange({ ...filters, availability: opt })}
            />
          ))}
        </div>
      </FilterSection>

      {/* Membership */}
      <FilterSection icon={Star} title="Membership">
        <div className="flex flex-wrap gap-1.5">
          {MEMBERSHIP_OPTIONS.map((opt) => (
            <FilterChip
              key={opt}
              label={opt}
              active={filters.membership === opt}
              onClick={() => onChange({ ...filters, membership: opt })}
            />
          ))}
        </div>
      </FilterSection>
    </div>
  );
}

function FilterSection({ icon: Icon, title, children }: { icon: React.ElementType; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl bg-surface p-3">
      <div className="mb-2 flex items-center gap-1.5">
        <Icon className="h-3 w-3 text-text-tertiary" />
        <span className="text-[11px] font-medium text-text-tertiary">{title}</span>
      </div>
      {children}
    </div>
  );
}

function FilterChip({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'rounded-full px-2.5 py-1 text-[10px] font-medium transition-all',
        active
          ? 'border border-accent/30 bg-accent/10 text-accent'
          : 'border border-border bg-surface text-text-tertiary hover:border-border hover:text-text-secondary'
      )}
    >
      {label}
    </button>
  );
}
