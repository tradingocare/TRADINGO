import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetaProgramService } from './beta-program.service';
import { CreateTicketDto } from './dto/create-ticket.dto';
import { AddMessageDto } from './dto/add-message.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { TicketStatus } from '@prisma/client';

@ApiTags('Beta Support')
@Controller('beta-support')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetaSupportController {
  constructor(private readonly betaProgramService: BetaProgramService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  async createTicket(
    @Body() dto: CreateTicketDto,
    @CurrentUser('sub') userId: string,
    @Req() req: any,
  ) {
    return this.betaProgramService.createTicket({
      ...dto,
      companyId: req.user.companyId,
      userId,
    });
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets' })
  async getTickets(
    @Req() req: any,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    return this.betaProgramService.getTickets(req.user.companyId, {
      page: page ? parseInt(page, 10) : undefined,
      limit: limit ? parseInt(limit, 10) : undefined,
      status,
    });
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket detail with messages' })
  async getTicket(@Param('id') id: string) {
    return this.betaProgramService.getTicket(id);
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add message to a ticket' })
  async addMessage(
    @Param('id') id: string,
    @Body() dto: AddMessageDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.betaProgramService.addMessage(id, dto, userId);
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: TicketStatus,
  ) {
    return this.betaProgramService.updateTicketStatus(id, status);
  }
}
