import { LoadingSpinner } from '@/components/ui/loading-spinner';

export default function TradeservLoading() {
  return (
    <div className="min-h-screen bg-bg-base flex items-center justify-center">
      <LoadingSpinner size="xl" />
    </div>
  );
}
