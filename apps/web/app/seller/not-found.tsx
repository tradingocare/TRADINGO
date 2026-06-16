import { NotFoundState } from '@/components/shared/not-found-state';

export default function SellerNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      message="The seller page you are looking for does not exist or has been moved."
      showHome
      showDashboard
      dashboardHref="/seller/dashboard"
    />
  );
}
