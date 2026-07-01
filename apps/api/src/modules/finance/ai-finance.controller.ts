import { Controller, Post, Body, Req, UseGuards } from '@nestjs/common'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AiFinanceService } from './ai-finance.service'
import {
  AiFinanceCreditRiskDto,
  AiFinancePaymentDelayDto,
  AiFinanceCashFlowDto,
  AiFinanceCollectionStrategyDto,
  AiFinanceFinancialHealthDto,
  AiFinanceCreditLimitDto,
  AiFinanceInvoiceIntelligenceDto,
  AiFinanceFraudSignalsDto,
  AiFinanceCollectionDraftDto,
  AiFinanceSidebarDto,
} from './dto/ai-finance.dto'

@ApiTags('AI FINANCE')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Controller('finance/ai')
export class AiFinanceController {
  constructor(private readonly aiFinanceService: AiFinanceService) {}

  @Post('credit-risk')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assess credit risk: approve/reject/review with confidence % and reason' })
  async creditRisk(@Body() dto: AiFinanceCreditRiskDto, @Req() req: any) {
    return this.aiFinanceService.creditRiskAssessment(req.user.sub, req.user.id, dto)
  }

  @Post('payment-delay')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Predict payment delay probability % based on invoice/company data' })
  async paymentDelay(@Body() dto: AiFinancePaymentDelayDto, @Req() req: any) {
    return this.aiFinanceService.paymentDelayPrediction(req.user.sub, req.user.id, dto)
  }

  @Post('cash-flow-forecast')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Generate cash flow forecast for 7/30/90 day periods' })
  async cashFlowForecast(@Body() dto: AiFinanceCashFlowDto, @Req() req: any) {
    return this.aiFinanceService.cashFlowForecast(req.user.sub, req.user.id, dto)
  }

  @Post('collection-strategy')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Recommend collection strategy: call/email/reminder/legal/hold/payment plan' })
  async collectionStrategy(@Body() dto: AiFinanceCollectionStrategyDto, @Req() req: any) {
    return this.aiFinanceService.collectionStrategy(req.user.sub, req.user.id, dto)
  }

  @Post('financial-health')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assess customer financial health: excellent/good/average/risky/critical' })
  async financialHealth(@Body() dto: AiFinanceFinancialHealthDto, @Req() req: any) {
    return this.aiFinanceService.financialHealth(req.user.sub, req.user.id, dto)
  }

  @Post('credit-limit')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Recommend credit limit action: increase/decrease/freeze/review' })
  async creditLimit(@Body() dto: AiFinanceCreditLimitDto, @Req() req: any) {
    return this.aiFinanceService.creditLimitRecommendation(req.user.sub, req.user.id, dto)
  }

  @Post('invoice-intelligence')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Analyse invoice: detect GST issues, duplicates, missing fields, risk' })
  async invoiceIntelligence(@Body() dto: AiFinanceInvoiceIntelligenceDto, @Req() req: any) {
    return this.aiFinanceService.invoiceIntelligence(req.user.sub, req.user.id, dto)
  }

  @Post('fraud-signals')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Detect fraud signals across payments, refunds, chargebacks, credit, collections' })
  async fraudSignals(@Body() dto: AiFinanceFraudSignalsDto, @Req() req: any) {
    return this.aiFinanceService.fraudSignals(req.user.sub, req.user.id, dto)
  }

  @Post('collection-draft')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Generate collection drafts: email, reminder letter, WhatsApp, SMS' })
  async collectionDraft(@Body() dto: AiFinanceCollectionDraftDto, @Req() req: any) {
    return this.aiFinanceService.collectionDraft(req.user.sub, req.user.id, dto)
  }

  @Post('sidebar')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'All-in-one finance copilot sidebar for detail page' })
  async sidebar(@Body() dto: AiFinanceSidebarDto, @Req() req: any) {
    return this.aiFinanceService.sidebar(req.user.sub, req.user.id, dto)
  }
}
