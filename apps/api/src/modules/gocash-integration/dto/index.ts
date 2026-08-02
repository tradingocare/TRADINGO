import { IsUUID, IsOptional, IsString } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class MembershipRewardDto {
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Plan ID' })
  planId?: string;
}

export class OrderCompletedDto {
  @IsUUID()
  @ApiProperty({ description: 'Order ID' })
  orderId: string;
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
  @IsOptional() @IsString()
  @ApiPropertyOptional({ description: 'Order number' })
  orderNumber?: string;
}

export class RfqCreatedDto {
  @IsUUID()
  @ApiProperty({ description: 'RFQ ID' })
  rfqId: string;
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}

export class QuoteAcceptedDto {
  @IsUUID()
  @ApiProperty({ description: 'Quote ID' })
  quoteId: string;
  @IsUUID()
  @ApiProperty({ description: 'Buyer ID' })
  buyerId: string;
  @IsUUID()
  @ApiProperty({ description: 'Seller ID' })
  sellerId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}

export class NegotiationCompletedDto {
  @IsUUID()
  @ApiProperty({ description: 'Negotiation ID' })
  negotiationId: string;
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}

export class PoConfirmedDto {
  @IsUUID()
  @ApiProperty({ description: 'PO ID' })
  poId: string;
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}

export class ShipmentConfirmedDto {
  @IsUUID()
  @ApiProperty({ description: 'Shipment ID' })
  shipmentId: string;
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}

export class DeliveryConfirmedDto {
  @IsUUID()
  @ApiProperty({ description: 'Delivery ID' })
  deliveryId: string;
  @IsUUID()
  @ApiProperty({ description: 'User ID' })
  userId: string;
  @IsUUID()
  @ApiProperty({ description: 'Company ID' })
  companyId: string;
}
