export interface AdvertisingContract {
  id: string;
  companyId: string;
  name: string;
  type: string;
  status: string;
  pricingModel: string;
  dailyBudget: number;
  totalBudget: number;
  spentBudget: number;
  startDate: string;
  endDate: string;
  title: string;
  description: string;
  targetUrl: string;
  mediaUrl: string;
  impressions: number;
  clicks: number;
  createdAt: string;
}

export interface CreateAdvertisingRequest {
  name: string;
  type: string;
  pricingModel: string;
  dailyBudget: number;
  totalBudget: number;
  startDate: string;
  endDate: string;
  title: string;
  description?: string;
  targetUrl?: string;
  mediaUrl?: string;
  targets?: Array<{ targetType: string; targetValue: string }>;
}
