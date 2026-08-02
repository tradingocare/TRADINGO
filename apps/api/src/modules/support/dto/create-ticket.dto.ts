import { IsString, IsOptional, IsEnum, MinLength, MaxLength } from 'class-validator'
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger'
import { TicketPriority, TicketStatus } from '@prisma/client'

export class CreateTicketDto {
  @IsString()
  @MinLength(3)
  @MaxLength(200)
  @ApiProperty({ description: 'Ticket subject' })
  subject: string

  @IsString()
  @MinLength(10)
  @MaxLength(5000)
  @ApiProperty({ description: 'Ticket description' })
  description: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Ticket category' })
  category?: string

  @IsOptional()
  @IsEnum(TicketPriority)
  @ApiPropertyOptional({ enum: TicketPriority, description: 'Ticket priority' })
  priority?: TicketPriority
}

export class AddMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(5000)
  @ApiProperty({ description: 'Message content' })
  message: string

  @IsOptional()
  @ApiPropertyOptional({ description: 'Attachments as JSON array' })
  attachments?: Record<string, unknown>[]
}

export class UpdateTicketStatusDto {
  @IsEnum(TicketStatus)
  @ApiProperty({ enum: TicketStatus, description: 'New ticket status' })
  status: TicketStatus

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ description: 'Internal note for status change' })
  note?: string
}

export class QueryTicketDto {
  @IsOptional()
  @IsEnum(TicketStatus)
  @ApiPropertyOptional({ enum: TicketStatus })
  status?: TicketStatus

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  category?: string

  @IsOptional()
  @IsString()
  @ApiPropertyOptional()
  search?: string

  @IsOptional()
  @ApiPropertyOptional()
  page?: number

  @IsOptional()
  @ApiPropertyOptional()
  limit?: number
}
