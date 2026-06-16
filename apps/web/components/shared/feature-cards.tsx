import Link from 'next/link';
import { ArrowRight, type LucideIcon } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
  href?: string;
  badge?: string;
  gradient?: string;
}

interface FeatureCardsProps {
  features: Feature[];
  columns?: 2 | 3 | 4;
  className?: string;
}

export function FeatureCards({ features, columns = 3, className }: FeatureCardsProps) {
  return (
    <div
      className={cn(
        'grid gap-6',
        columns === 2 && 'sm:grid-cols-2',
        columns === 3 && 'sm:grid-cols-2 lg:grid-cols-3',
        columns === 4 && 'sm:grid-cols-2 lg:grid-cols-4',
        className,
      )}
    >
      {features.map((feature) => {
        const Icon = feature.icon;
        return (
          <Card
            key={feature.title}
            className="group relative overflow-hidden transition-all duration-300 hover:shadow-lg hover:-translate-y-1"
          >
            {feature.gradient && (
              <div className={`absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100 ${feature.gradient}`} />
            )}
            <CardHeader>
              <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                <Icon className="h-6 w-6" />
              </div>
              <div className="flex items-center gap-2">
                <CardTitle className="text-lg">{feature.title}</CardTitle>
                {feature.badge && <Badge variant="default">{feature.badge}</Badge>}
              </div>
              <CardDescription className="text-base">{feature.description}</CardDescription>
            </CardHeader>
            {feature.href && (
              <CardContent>
                <Link
                  href={feature.href}
                  className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 hover:text-primary-700 dark:text-primary-400"
                >
                  View More <ArrowRight className="h-4 w-4" />
                </Link>
              </CardContent>
            )}
          </Card>
        );
      })}
    </div>
  );
}
