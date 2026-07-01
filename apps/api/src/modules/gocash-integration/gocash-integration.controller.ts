import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { GocashIntegrationService } from './gocash-integration.service';
import {
  MembershipRewardDto, OrderCompletedDto, RfqCreatedDto, QuoteAcceptedDto,
  NegotiationCompletedDto, PoConfirmedDto, ShipmentConfirmedDto, DeliveryConfirmedDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@Controller('gocash-integration')
@UseGuards(JwtAuthGuard, RolesGuard)
export class GocashIntegrationController {
  constructor(private readonly service: GocashIntegrationService) {}

  @Post('membership/signup')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardSignupBonus(@Body() dto: MembershipRewardDto, @Req() req: any) {
    return this.service.awardSignupBonus(dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('membership/plan-upgrade')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardPlanUpgrade(@Body() dto: MembershipRewardDto, @Req() req: any) {
    return this.service.awardPlanUpgradeBonus(dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId, dto.planId);
  }

  @Post('order/completed')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardOrderCompleted(@Body() dto: OrderCompletedDto, @Req() req: any) {
    return this.service.awardOrderCompleted(dto.orderId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('rfq/created')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardRfqCreated(@Body() dto: RfqCreatedDto, @Req() req: any) {
    return this.service.awardRfqCreated(dto.rfqId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('quote/accepted')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardQuoteAccepted(@Body() dto: QuoteAcceptedDto, @Req() req: any) {
    return this.service.awardQuoteAccepted(dto.quoteId, dto.buyerId ?? req.user.userId, dto.sellerId, dto.companyId ?? req.user.companyId);
  }

  @Post('negotiation/completed')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardNegotiationCompleted(@Body() dto: NegotiationCompletedDto, @Req() req: any) {
    return this.service.awardNegotiationCompleted(dto.negotiationId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('po/confirmed')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardPoConfirmed(@Body() dto: PoConfirmedDto, @Req() req: any) {
    return this.service.awardPoConfirmed(dto.poId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('shipment/confirmed')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardShipmentConfirmed(@Body() dto: ShipmentConfirmedDto, @Req() req: any) {
    return this.service.awardShipmentConfirmed(dto.shipmentId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('delivery/confirmed')
  @HttpCode(HttpStatus.OK)
  @Roles()
  awardDeliveryConfirmed(@Body() dto: DeliveryConfirmedDto, @Req() req: any) {
    return this.service.awardDeliveryConfirmed(dto.deliveryId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Get('summary')
  @Roles()
  getMySummary(@Req() req: any) {
    return this.service.getIntegrationSummary(req.user.userId);
  }
}
