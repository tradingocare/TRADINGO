import { NotFoundState } from '@/components/shared/not-found-state';

export default function BuyerNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      message="The buyer page you are looking for does not exist or has been moved."
      showHome
      showDashboard
      dashboardHref="/buyer/dashboard"
    />
  );
}
