import Link from 'next/link';
import {
  ArrowRight,
  ShoppingCart,
  FileText,
  Scale,
  Shield,
  Award,
  Zap,
  type LucideIcon,
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AnimatedSection } from './animated-section';
import { cn } from '@/lib/utils';

interface Engine {
  icon: LucideIcon;
  name: string;
  tagline: string;
  description: string;
  href: string;
  color: string;
}

const engines: Engine[] = [
  {
    icon: ShoppingCart,
    name: 'TRADBUY',
    tagline: 'Instant Purchase',
    description: 'Buy products instantly at listed prices with secure payment processing and automated order matching.',
    href: '/tradbuy',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: FileText,
    name: 'RFQ',
    tagline: 'Smart Negotiation',
    description: 'Submit requests for quotes and receive competitive bids from verified sellers in real-time.',
    href: '/rfq',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: Scale,
    name: 'Trade Matching',
    tagline: 'AI-Powered Match',
    description: 'Our intelligent algorithm matches buyers with the right sellers based on product, price, and location.',
    href: '/trading',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: Shield,
    name: 'Secure Escrow',
    tagline: 'Protected Payments',
    description: 'Funds are held in escrow until both parties confirm satisfaction, ensuring zero-risk transactions.',
    href: '/why-tradingo',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: Award,
    name: 'GOCASH',
    tagline: 'Rewards Engine',
    description: 'Earn GOCASH rewards on every successful trade and redeem them for platform benefits and discounts.',
    href: '/gocash',
    color: 'from-amber-500 to-yellow-500',
  },
  {
    icon: Zap,
    name: 'TRADGO',
    tagline: 'Gamified Trading',
    description: 'Participate in trading races, earn badges, climb leaderboards, and unlock exclusive seller perks.',
    href: '/tradgo',
    color: 'from-rose-500 to-pink-500',
  },
];

export function TradingEngines() {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {engines.map((engine, index) => {
        const Icon = engine.icon;
        return (
          <AnimatedSection key={engine.name} delay={index * 100}>
            <Link href={engine.href} className="group block">
              <Card className="h-full transition-all duration-300 hover:shadow-lg hover:-translate-y-1">
                <CardHeader>
                  <div
                    className={cn(
                      'mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm',
                      engine.color,
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>
                  <div className="flex items-center gap-2">
                    <CardTitle className="text-lg">
                      {engine.name}
                      <span className="ml-1 text-sm font-normal text-text-tertiary dark:text-dark-text-tertiary">
                        ™
                      </span>
                    </CardTitle>
                    <Badge variant="secondary" className="text-[10px]">
                      {engine.tagline}
                    </Badge>
                  </div>
                  <CardDescription className="text-base">{engine.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <span className="inline-flex items-center gap-1 text-sm font-medium text-primary-600 group-hover:gap-2 dark:text-primary-400">
                    Learn more <ArrowRight className="h-4 w-4 transition-all" />
                  </span>
                </CardContent>
              </Card>
            </Link>
          </AnimatedSection>
        );
      })}
    </div>
  );
}
