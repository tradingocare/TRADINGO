import type { Metadata } from 'next';
import { engines } from '@/lib/data/tradhexa-engines';
import EngineDetailPage from '@/components/shared/engine-detail-page';

const engine = engines.find(e => e.id === 'tradtrust')!;

export const metadata: Metadata = {
  title: 'TRADTRUST — Trust & Verification Engine | TRADINGO',
  description: engine.description,
};

export default function Page() {
  return <EngineDetailPage engineId="tradtrust" />;
}
