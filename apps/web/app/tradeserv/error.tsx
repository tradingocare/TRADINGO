'use client';

import { ErrorState } from '@/components/shared/error-state';

export default function TradeservError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return <ErrorState title="TradeServ Error" message="Something went wrong in TradeServ" error={error} reset={reset} showHome />;
}
