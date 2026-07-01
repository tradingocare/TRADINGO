import { IsString, IsOptional, IsObject, IsNumber, IsArray, Min, Max, IsEnum } from 'class-validator'

export class AiFinanceCreditRiskDto {
  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  tradTrustData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  requestedLimit?: number
}

export class AiFinancePaymentDelayDto {
  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  invoiceAmount?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  daysOverdue?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  avgPaymentDays?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  onTimePaymentRate?: number
}

export class AiFinanceCashFlowDto {
  @IsNumber()
  @IsOptional()
  currentInflow?: number

  @IsNumber()
  @IsOptional()
  currentOutflow?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentBalance?: number

  @IsNumber()
  @IsOptional()
  avgMonthlyRevenue?: number

  @IsNumber()
  @IsOptional()
  avgMonthlyExpenses?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  outstandingReceivables?: number

  @IsNumber()
  @IsOptional()
  forecastPeriodDays?: number
}

export class AiFinanceCollectionStrategyDto {
  @IsObject()
  companyData?: Record<string, unknown>

  @IsNumber()
  @Min(0)
  totalOverdue: number

  @IsNumber()
  @Min(0)
  daysOverdue: number

  @IsArray()
  @IsOptional()
  pastActions?: { type: string; outcome?: string; date: string }[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalInvoices?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  avgInvoiceValue?: number
}

export class AiFinanceFinancialHealthDto {
  @IsObject()
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  tradTrustData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentTransactions?: Record<string, unknown>[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalRevenue?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalOverdue?: number
}

export class AiFinanceCreditLimitDto {
  @IsObject()
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  tradTrustData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentLimit?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  utilizationRate?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  trustScore?: number
}

export class AiFinanceInvoiceIntelligenceDto {
  @IsObject()
  invoiceData?: Record<string, unknown>

  @IsString()
  @IsOptional()
  gstNumber?: string

  @IsString()
  @IsOptional()
  invoiceNumber?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  amount?: number

  @IsArray()
  @IsOptional()
  items?: Record<string, unknown>[]
}

export class AiFinanceFraudSignalsDto {
  @IsArray()
  @IsOptional()
  recentPayments?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  recentRefunds?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  recentChargebacks?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  collectionData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>
}

export class AiFinanceCollectionDraftDto {
  @IsString()
  customerName: string

  @IsNumber()
  @Min(0)
  outstandingAmount: number

  @IsNumber()
  @Min(0)
  daysOverdue: number

  @IsString()
  @IsOptional()
  invoiceNumber?: string

  @IsString()
  @IsOptional()
  companyName?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalOutstanding?: number
}

export class AiFinanceSidebarDto {
  @IsObject()
  @IsOptional()
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  tradTrustData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  recentPayments?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  collectionData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  totalOverdue?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  currentBalance?: number
}
