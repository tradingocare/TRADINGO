export interface LeadContract {
  id: string;
  companyId: string;
  name: string;
  email: string;
  phone?: string;
  status: string;
  source: string;
  priority: string;
  assignedTo?: string;
  score: number;
  createdAt: string;
}

export interface CreateLeadRequest {
  name: string;
  email: string;
  phone?: string;
  source?: string;
  priority?: string;
  notes?: string;
}
