import { NotFoundState } from '@/components/shared/not-found-state';

export default function TradeservNotFound() {
  return (
    <NotFoundState
      title="Page not found"
      message="The TradeServ page you are looking for does not exist or has been moved."
      showHome
      showDashboard
      dashboardHref="/tradeserv"
    />
  );
}
