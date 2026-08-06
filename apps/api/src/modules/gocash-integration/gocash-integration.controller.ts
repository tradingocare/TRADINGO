import { Controller, Post, Get, Body, HttpCode, HttpStatus, UseGuards, Req } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GocashIntegrationService } from './gocash-integration.service';
import {
  MembershipRewardDto, OrderCompletedDto, RfqCreatedDto, QuoteAcceptedDto,
  NegotiationCompletedDto, PoConfirmedDto, ShipmentConfirmedDto, DeliveryConfirmedDto,
} from './dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';

@ApiTags('GOCASH Integration')
@Controller('gocash-integration')
@UseGuards(JwtAuthGuard, RolesGuard)
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class GocashIntegrationController {
  constructor(private readonly service: GocashIntegrationService) {}

  @Post('membership/signup')
  @ApiOperation({ summary: 'Award signup bonus' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardSignupBonus(@Body() dto: MembershipRewardDto, @Req() req: any) {
    return this.service.awardSignupBonus(dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('membership/plan-upgrade')
  @ApiOperation({ summary: 'Award plan upgrade bonus' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardPlanUpgrade(@Body() dto: MembershipRewardDto, @Req() req: any) {
    return this.service.awardPlanUpgradeBonus(dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId, dto.planId);
  }

  @Post('order/completed')
  @ApiOperation({ summary: 'Award order completed reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardOrderCompleted(@Body() dto: OrderCompletedDto, @Req() req: any) {
    return this.service.awardOrderCompleted(dto.orderId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('rfq/created')
  @ApiOperation({ summary: 'Award RFQ created reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardRfqCreated(@Body() dto: RfqCreatedDto, @Req() req: any) {
    return this.service.awardRfqCreated(dto.rfqId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('quote/accepted')
  @ApiOperation({ summary: 'Award quote accepted reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardQuoteAccepted(@Body() dto: QuoteAcceptedDto, @Req() req: any) {
    return this.service.awardQuoteAccepted(dto.quoteId, dto.buyerId ?? req.user.userId, dto.sellerId, dto.companyId ?? req.user.companyId);
  }

  @Post('negotiation/completed')
  @ApiOperation({ summary: 'Award negotiation completed reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardNegotiationCompleted(@Body() dto: NegotiationCompletedDto, @Req() req: any) {
    return this.service.awardNegotiationCompleted(dto.negotiationId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('po/confirmed')
  @ApiOperation({ summary: 'Award PO confirmed reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardPoConfirmed(@Body() dto: PoConfirmedDto, @Req() req: any) {
    return this.service.awardPoConfirmed(dto.poId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('shipment/confirmed')
  @ApiOperation({ summary: 'Award shipment confirmed reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardShipmentConfirmed(@Body() dto: ShipmentConfirmedDto, @Req() req: any) {
    return this.service.awardShipmentConfirmed(dto.shipmentId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Post('delivery/confirmed')
  @ApiOperation({ summary: 'Award delivery confirmed reward' })
  @HttpCode(HttpStatus.OK)
  @Roles('ADMIN')
  awardDeliveryConfirmed(@Body() dto: DeliveryConfirmedDto, @Req() req: any) {
    return this.service.awardDeliveryConfirmed(dto.deliveryId, dto.userId ?? req.user.userId, dto.companyId ?? req.user.companyId);
  }

  @Get('summary')
  @ApiOperation({ summary: 'Get integration summary' })
  @Roles('BUYER', 'SELLER', 'ADMIN')
  getMySummary(@Req() req: any) {
    return this.service.getIntegrationSummary(req.user.userId);
  }
}
