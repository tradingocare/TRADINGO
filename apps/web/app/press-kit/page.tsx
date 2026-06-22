import type { Metadata } from 'next';
import { Download, Mail, Image, Users, Newspaper } from 'lucide-react';
import { PageHeader } from '@/components/shared/page-header';
import { SectionHeader } from '@/components/shared/section-header';
import { AnimatedSection } from '@/components/shared/animated-section';
import { CTABlock } from '@/components/shared/cta-block';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';

export const metadata: Metadata = {
  title: 'Press Kit | TRADINGO',
  description:
    'Download TRADINGO brand assets, logos, screenshots, and media resources. For press inquiries and media coverage.',
};

const keyFacts = [
  { label: 'Founded', value: '2024' },
  { label: 'Headquarters', value: 'Mumbai, India' },
  { label: 'Platform', value: 'B2B E-Marketplace (TEM)' },
  { label: 'Sectors', value: 'Multi-industry' },
  { label: 'Users', value: '10,000+ Beta Companies' },
  { label: 'Products Listed', value: '50,000+' },
  { label: 'Geographic Reach', value: '500+ Cities' },
  { label: 'Trading Volume', value: '₹500Cr+' },
];

const brandAssets = [
  { name: 'TRADINGO Logo — PNG', description: 'Full color logo on transparent background', variant: 'Light' },
  { name: 'TRADINGO Logo — Dark', description: 'Full color logo for dark backgrounds', variant: 'Dark' },
  { name: 'TRADINGO Icon — SVG', description: 'Standalone icon in vector format', variant: 'Light' },
  { name: 'TRADINGO Icon — Dark SVG', description: 'Standalone icon for dark backgrounds', variant: 'Dark' },
  { name: 'TRADINGO Wordmark', description: 'Typography-only wordmark logo', variant: 'Light' },
  { name: 'TRADINGO Wordmark Dark', description: 'Wordmark for dark background use', variant: 'Dark' },
];

const screenshots = [
  { title: 'Dashboard Overview', description: 'Seller dashboard with analytics and KPIs' },
  { title: 'Product Listing', description: 'Product catalog management interface' },
  { title: 'RFQ Management', description: 'Quote request and response workflow' },
  { title: 'Escrow Payments', description: 'Secure payment and escrow management' },
  { title: 'GOCASH Rewards', description: 'Rewards and loyalty program dashboard' },
  { title: 'Mobile App', description: 'TRADINGO mobile application screens' },
];

const leadership = [
  { name: 'Rajesh Mehta', role: 'Chief Executive Officer', bio: '20+ years in B2B trade and supply chain technology.' },
  { name: 'Priya Sharma', role: 'Chief Technology Officer', bio: 'Former engineering lead at major marketplace platforms.' },
  { name: 'Amit Verma', role: 'Chief Operating Officer', bio: 'Operations expert with deep logistics and fulfillment experience.' },
  { name: 'Sneha Patel', role: 'Chief Product Officer', bio: 'Product leader specializing in marketplace and fintech products.' },
  { name: 'Vikram Singh', role: 'Chief Financial Officer', bio: 'Experienced finance leader from the B2B SaaS space.' },
  { name: 'Ananya Gupta', role: 'VP of Marketing', bio: 'Marketing strategist with expertise in B2B brand building.' },
];

const pressMentions = [
  'Economic Times', 'Business Standard', 'YourStory', 'Inc42',
  'Entrepreneur India', 'TechCircle', 'Financial Express', 'Hindu BusinessLine',
];

export default function PressKitPage() {
  return (
    <>
      <PageHeader
        title="Press Kit"
        description="Media resources, brand assets, and company information for press and media professionals."
      />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="About TRADINGO"
              subtitle="India's first TEM (Trust, E-Marketplace, Multiplier) platform transforming B2B trade."
              align="left"
            />
            <div className="mx-auto max-w-4xl space-y-6">
              <p className="text-lg leading-relaxed text-text-secondary dark:text-dark-text-secondary">
                TRADINGO is India&apos;s first TEM E-Marketplace, connecting buyers and sellers through
                trust, technology, and transparent trading. Founded in 2024 and headquartered in Mumbai,
                TRADINGO provides a comprehensive B2B trading platform featuring AI-powered product matching,
                secure escrow payments, real-time negotiation, and gamified rewards through GOCASH and TRADGO.
              </p>
              <p className="text-lg leading-relaxed text-text-secondary dark:text-dark-text-secondary">
                Our mission is to democratize B2B trade in India by providing businesses of all sizes with
                the tools, trust infrastructure, and market access previously available only to large
                enterprises. We serve multi-industry sectors including electronics, textiles, chemicals,
                FMCG, industrial equipment, and more across 500+ cities.
              </p>
              <div className="mt-8 overflow-hidden rounded-xl border border-border dark:border-dark-border">
                <table className="w-full">
                  <tbody className="divide-y divide-border dark:divide-dark-border">
                    {keyFacts.map((fact) => (
                      <tr key={fact.label} className="bg-surface hover:bg-surface-secondary/30 dark:bg-dark-surface dark:hover:bg-dark-surface-secondary/30">
                        <td className="px-6 py-4 text-sm font-semibold text-text-primary dark:text-dark-text-primary w-48">
                          {fact.label}
                        </td>
                        <td className="px-6 py-4 text-sm text-text-secondary dark:text-dark-text-secondary">
                          {fact.value}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Brand Assets"
              subtitle="Download official TRADINGO logos and branding materials."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {brandAssets.map((asset) => (
                <Card key={asset.name} className="transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="mb-3 flex h-24 items-center justify-center rounded-lg border-2 border-dashed border-border bg-surface-secondary/50 dark:bg-dark-surface-secondary/50 dark:border-dark-border">
                      <span className="text-2xl font-bold tracking-tight text-primary-600 dark:text-primary-400">
                        TRADINGO
                      </span>
                    </div>
                    <CardTitle className="text-base">{asset.name}</CardTitle>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                      {asset.description}
                    </p>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <Badge variant="outline" className="text-xs">
                        {asset.variant}
                      </Badge>
                      <Badge variant="default" className="cursor-pointer gap-1">
                        <Download className="h-3 w-3" />
                        Download
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Screenshots"
              subtitle="Platform screenshots for media and presentation use."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {screenshots.map((ss) => (
                <Card key={ss.title} className="overflow-hidden transition-all duration-300 hover:shadow-lg">
                  <div className="flex h-44 items-center justify-center bg-gradient-to-br from-primary-50 to-primary-100 dark:from-primary-900/20 dark:to-primary-800/20">
                    <Image className="h-12 w-12 text-primary-400" />
                  </div>
                  <CardHeader>
                    <CardTitle className="text-base">{ss.title}</CardTitle>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                      {ss.description}
                    </p>
                  </CardHeader>
                </Card>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Leadership"
              subtitle="Meet the team behind TRADINGO."
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {leadership.map((member) => (
                <Card key={member.name} className="text-center transition-all duration-300 hover:shadow-lg">
                  <CardHeader>
                    <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700">
                      <Users className="h-8 w-8 text-primary-600 dark:text-primary-300" />
                    </div>
                    <CardTitle className="text-lg">{member.name}</CardTitle>
                    <p className="text-sm font-medium text-primary-600 dark:text-primary-400">{member.role}</p>
                  </CardHeader>
                  <CardContent>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">{member.bio}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Press Coverage"
              subtitle="Featured In"
            />
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {pressMentions.map((outlet) => (
                <div
                  key={outlet}
                  className="flex h-20 items-center justify-center rounded-xl border border-border bg-surface px-6 shadow-sm dark:bg-dark-surface dark:border-dark-border"
                >
                  <Newspaper className="mr-2 h-5 w-5 text-text-tertiary dark:text-dark-text-tertiary" />
                  <span className="text-sm font-semibold text-text-secondary dark:text-dark-text-secondary">
                    {outlet}
                  </span>
                </div>
              ))}
            </div>
          </AnimatedSection>
        </div>
      </section>

      <Separator />

      <section className="py-20 bg-surface-secondary/50 dark:bg-dark-surface-secondary/50">
        <div className="container-main">
          <AnimatedSection>
            <SectionHeader
              title="Press Contact"
              subtitle="For press inquiries, interview requests, and media partnerships."
              align="left"
            />
            <div className="mx-auto max-w-2xl">
              <Card>
                <CardContent className="flex items-center gap-4 p-8">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary-50 text-primary-600 dark:bg-primary-900/30 dark:text-primary-400">
                    <Mail className="h-6 w-6" />
                  </div>
                  <div>
                    <p className="font-semibold text-text-primary dark:text-dark-text-primary">Press Team</p>
                    <a
                      href="mailto:press@tradingo.in"
                      className="text-primary-600 hover:text-primary-700 dark:text-primary-400 dark:hover:text-primary-300"
                    >
                      press@tradingo.in
                    </a>
                  </div>
                </CardContent>
              </Card>
            </div>
          </AnimatedSection>
        </div>
      </section>

      <CTABlock
        variant="simple"
        title="Stay Updated with TRADINGO"
        subtitle="Follow our journey as we transform B2B trade in India."
        primaryLabel="Visit Blog"
        primaryHref="/about-tradingo"
        secondaryLabel="Contact Us"
        secondaryHref="/contact"
      />
    </>
  );
}
