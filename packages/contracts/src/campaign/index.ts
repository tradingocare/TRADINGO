export interface CampaignContract {
  id: string;
  name: string;
  type: string;
  status: string;
  budget: number;
  spentBudget: number;
  startDate: string;
  endDate: string;
  rewardAmount: number;
  maxClaims: number;
  currentClaims: number;
  createdAt: string;
}

export interface CreateCampaignRequest {
  name: string;
  type: string;
  budget: number;
  startDate: string;
  endDate: string;
  rewardAmount: number;
  maxClaims?: number;
  eligibility?: Record<string, unknown>;
}
