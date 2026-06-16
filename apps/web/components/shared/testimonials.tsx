'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { AnimatedSection } from './animated-section';

interface Testimonial {
  quote: string;
  author: string;
  role: string;
  company: string;
  rating: number;
}

interface TestimonialsProps {
  testimonials: Testimonial[];
  className?: string;
}

export function Testimonials({ testimonials, className }: TestimonialsProps) {
  const [current, setCurrent] = useState(0);
  const total = testimonials.length;

  const next = () => setCurrent((c) => (c + 1) % total);
  const prev = () => setCurrent((c) => (c - 1 + total) % total);

  return (
    <AnimatedSection className={className}>
      <div className="relative">
        <div className="overflow-hidden">
          <div
            className="flex transition-transform duration-500"
            style={{ transform: `translateX(-${current * 100}%)` }}
          >
            {testimonials.map((t) => (
              <div key={t.author} className="w-full flex-shrink-0 px-4">
                <Card className="mx-auto max-w-2xl">
                  <CardContent className="p-8 text-center">
                    <div className="mb-4 flex justify-center gap-1">
                      {Array.from({ length: t.rating }).map((_, i) => (
                        <Star key={i} className="h-5 w-5 fill-amber-400 text-amber-400" />
                      ))}
                    </div>
                    <blockquote className="text-lg leading-relaxed text-text-primary dark:text-dark-text-primary">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>
                    <div className="mt-6">
                      <p className="font-semibold text-text-primary dark:text-dark-text-primary">{t.author}</p>
                      <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                        {t.role}, {t.company}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>

        <button
          onClick={prev}
          className="absolute left-0 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface p-2 shadow-sm transition-colors hover:bg-surface-secondary dark:bg-dark-surface dark:border-dark-border"
          aria-label="Previous testimonial"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          onClick={next}
          className="absolute right-0 top-1/2 -translate-y-1/2 rounded-full border border-border bg-surface p-2 shadow-sm transition-colors hover:bg-surface-secondary dark:bg-dark-surface dark:border-dark-border"
          aria-label="Next testimonial"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="mt-6 flex justify-center gap-2">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={cn(
                'h-2 w-2 rounded-full transition-all',
                i === current ? 'w-6 bg-primary-600' : 'bg-border dark:bg-dark-border',
              )}
              aria-label={`Go to testimonial ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </AnimatedSection>
  );
}
