import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradeservService } from './tradeserv.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateProposalDto, UpdateProposalStatusDto } from './dto';

@ApiTags('TradeServ Proposals')
@Controller('tradeserv/proposals')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class TradeservProposalController {
  constructor(private readonly service: TradeservService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a proposal' })
  async create(@Body() dto: CreateProposalDto, @CurrentUser('companyId') companyId: string) {
    return this.service.createProposal(companyId, dto.clientId, dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my proposals' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async list(
    @CurrentUser('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const [asProfessional, asClient] = await Promise.all([
      this.service.getProposals(companyId, 'professional', p, l),
      this.service.getProposals(companyId, 'client', p, l),
    ]);
    return {
      asProfessional: asProfessional.data,
      asClient: asClient.data,
      meta: { professional: asProfessional.meta, client: asClient.meta },
    };
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update proposal status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateProposalStatusDto, @CurrentUser('companyId') companyId: string) {
    return this.service.updateProposalStatus(id, companyId, dto);
  }
}
