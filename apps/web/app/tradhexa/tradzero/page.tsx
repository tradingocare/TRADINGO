import type { Metadata } from 'next';
import { engines } from '@/lib/data/tradhexa-engines';
import EngineDetailPage from '@/components/shared/engine-detail-page';

const engine = engines.find(e => e.id === 'tradzero')!;

export const metadata: Metadata = {
  title: 'TRADZERO — Zero-Risk Transaction Engine | TRADINGO',
  description: engine.description,
};

export default function Page() {
  return <EngineDetailPage engineId="tradzero" />;
}
