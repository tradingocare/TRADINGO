import { IsString, IsOptional, IsObject, IsNumber, IsArray, Min, Max } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'

export class AiFinanceCreditRiskDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Credit data' })
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'TradTrust data' })
  tradTrustData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Requested credit limit' })
  requestedLimit?: number
}

export class AiFinancePaymentDelayDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Invoice amount' })
  invoiceAmount?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Days overdue' })
  daysOverdue?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Average payment days' })
  avgPaymentDays?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'On-time payment rate' })
  onTimePaymentRate?: number
}

export class AiFinanceCashFlowDto {
  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Current inflow' })
  currentInflow?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Current outflow' })
  currentOutflow?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Current balance' })
  currentBalance?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Average monthly revenue' })
  avgMonthlyRevenue?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Average monthly expenses' })
  avgMonthlyExpenses?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Outstanding receivables' })
  outstandingReceivables?: number

  @IsNumber()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Forecast period in days' })
  forecastPeriodDays?: number
}

export class AiFinanceCollectionStrategyDto {
  @IsObject()
  @ApiProperty({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Total overdue amount' })
  totalOverdue: number

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Days overdue' })
  daysOverdue: number

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Past collection actions' })
  pastActions?: { type: string; outcome?: string; date: string }[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Total invoices' })
  totalInvoices?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Average invoice value' })
  avgInvoiceValue?: number
}

export class AiFinanceFinancialHealthDto {
  @IsObject()
  @ApiProperty({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Credit data' })
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'TradTrust data' })
  tradTrustData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent transactions' })
  recentTransactions?: Record<string, unknown>[]

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Total revenue' })
  totalRevenue?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Total overdue' })
  totalOverdue?: number
}

export class AiFinanceCreditLimitDto {
  @IsObject()
  @ApiProperty({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Credit data' })
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'TradTrust data' })
  tradTrustData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Current credit limit' })
  currentLimit?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(100)
  @ApiPropertyOptional({ description: 'Credit utilization rate (%)' })
  utilizationRate?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(1000)
  @ApiPropertyOptional({ description: 'Trust score' })
  trustScore?: number
}

export class AiFinanceInvoiceIntelligenceDto {
  @IsObject()
  @ApiProperty({ description: 'Invoice data' })
  invoiceData?: Record<string, unknown>

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'GST number' })
  gstNumber?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Invoice number' })
  invoiceNumber?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Invoice amount' })
  amount?: number

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Invoice items' })
  items?: Record<string, unknown>[]
}

export class AiFinanceFraudSignalsDto {
  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent payments' })
  recentPayments?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent refunds' })
  recentRefunds?: Record<string, unknown>[]

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent chargebacks' })
  recentChargebacks?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Credit data' })
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Collection data' })
  collectionData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>
}

export class AiFinanceCollectionDraftDto {
  @IsString()
  @ApiProperty({ description: 'Customer name' })
  customerName: string

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Outstanding amount' })
  outstandingAmount: number

  @IsNumber()
  @Min(0)
  @ApiProperty({ description: 'Days overdue' })
  daysOverdue: number

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Invoice number' })
  invoiceNumber?: string

  @IsString()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company name' })
  companyName?: string

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Total outstanding' })
  totalOutstanding?: number
}

export class AiFinanceSidebarDto {
  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Company data' })
  companyData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Credit data' })
  creditData?: Record<string, unknown>

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'TradTrust data' })
  tradTrustData?: Record<string, unknown>

  @IsArray()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Recent payments' })
  recentPayments?: Record<string, unknown>[]

  @IsObject()
  @IsOptional()
  @ApiPropertyOptional({ description: 'Collection data' })
  collectionData?: Record<string, unknown>

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Total overdue' })
  totalOverdue?: number

  @IsNumber()
  @IsOptional()
  @Min(0)
  @ApiPropertyOptional({ description: 'Current balance' })
  currentBalance?: number
}
