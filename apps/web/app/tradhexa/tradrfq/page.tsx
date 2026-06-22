import type { Metadata } from 'next';
import { engines } from '@/lib/data/tradhexa-engines';
import EngineDetailPage from '@/components/shared/engine-detail-page';

const engine = engines.find(e => e.id === 'tradrfq')!;

export const metadata: Metadata = {
  title: 'TRADRFQ — Smart RFQ & Negotiation Engine | TRADINGO',
  description: engine.description,
};

export default function Page() {
  return <EngineDetailPage engineId="tradrfq" />;
}
