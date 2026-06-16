import Link from 'next/link';
import { Check, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface PricingPlan {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  href: string;
  popular?: boolean;
  highlight?: string;
}

interface PricingCardsProps {
  plans: PricingPlan[];
  className?: string;
}

export function PricingCards({ plans, className }: PricingCardsProps) {
  return (
    <div className={cn('grid gap-8 lg:grid-cols-3', className)}>
      {plans.map((plan) => (
        <div
          key={plan.name}
          className={cn(
            'relative flex flex-col rounded-2xl border p-8 shadow-sm transition-all duration-300',
            plan.popular
              ? 'border-primary-500 bg-primary-50/50 shadow-lg dark:bg-primary-900/10 dark:border-primary-500'
              : 'border-border bg-surface dark:bg-dark-surface dark:border-dark-border',
          )}
        >
          {plan.popular && (
            <div className="absolute -top-3 left-1/2 -translate-x-1/2">
              <Badge variant="default" className="px-4 py-1 text-xs">
                Most Popular
              </Badge>
            </div>
          )}
          {plan.highlight && (
            <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-primary-600 dark:text-primary-400">
              {plan.highlight}
            </p>
          )}
          <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">{plan.name}</h3>
          <p className="mt-2 text-sm text-text-secondary dark:text-dark-text-secondary">{plan.description}</p>
          <div className="mt-6 flex items-baseline gap-1">
            <span className="text-4xl font-bold tracking-tight text-text-primary dark:text-dark-text-primary">
              {plan.price}
            </span>
            {plan.period && (
              <span className="text-sm text-text-tertiary dark:text-dark-text-tertiary">/{plan.period}</span>
            )}
          </div>
          <ul className="mt-8 flex-1 space-y-4">
            {plan.features.map((feature) => (
              <li key={feature} className="flex items-start gap-3">
                <Check className="mt-1 h-4 w-4 flex-shrink-0 text-accent-500" />
                <span className="text-sm text-text-secondary dark:text-dark-text-secondary">{feature}</span>
              </li>
            ))}
          </ul>
          <Link href={plan.href} className="mt-8 block">
            <Button
              variant={plan.popular ? 'default' : 'outline'}
              className="w-full"
              size="lg"
            >
              Get Started
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </Link>
        </div>
      ))}
    </div>
  );
}
