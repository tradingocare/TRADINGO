export interface CreditContract {
  id: string;
  companyId: string;
  creditLimit: number;
  usedCredit: number;
  availableCredit: number;
  status: string;
  riskLevel: string;
}

export interface CreditNoteContract {
  id: string;
  companyId: string;
  amount: number;
  reason: string;
  status: string;
}

export interface DebitNoteContract {
  id: string;
  companyId: string;
  amount: number;
  reason: string;
  status: string;
}
