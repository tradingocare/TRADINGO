import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards, Req } from '@nestjs/common'
import { ApiTags, ApiOperation } from '@nestjs/swagger'
import { AuthGuard } from '@nestjs/passport'
import { RolesGuard } from '../../common/guards/roles.guard'
import { Roles } from '../../common/decorators/roles.decorator'
import { Throttle } from '@nestjs/throttler'
import { RateLimits } from '../../common/constants/rate-limits.const'
import { SupportService } from './support.service'
import { CreateTicketDto, AddMessageDto, UpdateTicketStatusDto, QueryTicketDto } from './dto/create-ticket.dto'

@ApiTags('Support')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('support')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class SupportController {
  constructor(private readonly supportService: SupportService) {}

  @Post('tickets')
  @ApiOperation({ summary: 'Create a support ticket' })
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async createTicket(@Body() dto: CreateTicketDto, @Req() req: any) {
    return this.supportService.createTicket(req.user.sub, req.user.companyId, dto)
  }

  @Get('tickets')
  @ApiOperation({ summary: 'List support tickets' })
  async getTickets(@Query() query: QueryTicketDto, @Req() req: any) {
    return this.supportService.getTickets(req.user.sub, req.user.companyId, req.user.role, query)
  }

  @Get('tickets/:id')
  @ApiOperation({ summary: 'Get ticket detail' })
  async getTicket(@Param('id') id: string, @Req() req: any) {
    return this.supportService.getTicket(id, req.user.sub, req.user.companyId, req.user.role)
  }

  @Post('tickets/:id/messages')
  @ApiOperation({ summary: 'Add message to ticket' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async addMessage(@Param('id') id: string, @Body() dto: AddMessageDto, @Req() req: any) {
    return this.supportService.addMessage(id, req.user.sub, req.user.companyId, req.user.role, dto)
  }

  @Patch('tickets/:id/status')
  @ApiOperation({ summary: 'Update ticket status (admin)' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateTicketStatusDto, @Req() req: any) {
    return this.supportService.updateStatus(id, req.user.sub, req.user.role, dto)
  }

  @Post('tickets/:id/assign')
  @ApiOperation({ summary: 'Assign ticket to admin (admin)' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  async assignTicket(@Param('id') id: string, @Body('assigneeId') assigneeId: string, @Req() req: any) {
    return this.supportService.assignTicket(id, assigneeId, req.user.role)
  }

  @Get('categories')
  @ApiOperation({ summary: 'List ticket categories' })
  async getCategories(@Req() req: any) {
    return this.supportService.getCategories(req.user.role, req.user.companyId)
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get ticket statistics' })
  @Roles('ADMIN', 'SUPER_ADMIN')
  async getStats() {
    return this.supportService.getStats('ADMIN')
  }
}
