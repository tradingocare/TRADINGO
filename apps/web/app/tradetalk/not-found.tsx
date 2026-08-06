import { NotFoundState } from '@/components/shared/not-found-state';

export default function TradeTalkNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      message="The TradeTalk page you are looking for does not exist or has been moved."
      showHome
    />
  );
}
