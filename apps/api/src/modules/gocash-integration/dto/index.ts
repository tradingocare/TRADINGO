import { IsUUID, IsOptional, IsString } from 'class-validator';

export class MembershipRewardDto {
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
  @IsOptional() @IsString() planId?: string;
}

export class OrderCompletedDto {
  @IsUUID() orderId: string;
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
  @IsOptional() @IsString() orderNumber?: string;
}

export class RfqCreatedDto {
  @IsUUID() rfqId: string;
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
}

export class QuoteAcceptedDto {
  @IsUUID() quoteId: string;
  @IsUUID() buyerId: string;
  @IsUUID() sellerId: string;
  @IsUUID() companyId: string;
}

export class NegotiationCompletedDto {
  @IsUUID() negotiationId: string;
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
}

export class PoConfirmedDto {
  @IsUUID() poId: string;
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
}

export class ShipmentConfirmedDto {
  @IsUUID() shipmentId: string;
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
}

export class DeliveryConfirmedDto {
  @IsUUID() deliveryId: string;
  @IsUUID() userId: string;
  @IsUUID() companyId: string;
}
