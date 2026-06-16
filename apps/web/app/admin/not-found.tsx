import { NotFoundState } from '@/components/shared/not-found-state';

export default function AdminNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      message="The admin page you are looking for does not exist or has been moved."
      showHome
      showDashboard
      dashboardHref="/admin/dashboard"
    />
  );
}
