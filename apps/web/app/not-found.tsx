import { NotFoundState } from '@/components/shared/not-found-state';

export default function RootNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      message="The page you are looking for does not exist or has been moved."
      showHome
      showSearch
    />
  );
}
