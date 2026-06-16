import { Controller, Get, Post, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { TradmatchService } from './tradmatch.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';

@ApiTags('TRADMATCH')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/rfq/:rfqId/matches')
export class TradmatchController {
  constructor(private readonly tradmatchService: TradmatchService) {}

  @Post()
  @ApiOperation({ summary: 'Find and broadcast vendor matches for an RFQ' })
  async findMatches(@Param('rfqId') rfqId: string) {
    return this.tradmatchService.findMatches(rfqId);
  }

  @Get()
  @ApiOperation({ summary: 'List all vendor matches for an RFQ' })
  async getMatches(@Param('rfqId') rfqId: string) {
    return this.tradmatchService.getMatches(rfqId);
  }

  @Get(':matchId')
  @ApiOperation({ summary: 'Get a specific vendor match details' })
  async getMatchById(
    @Param('rfqId') rfqId: string,
    @Param('matchId') matchId: string,
  ) {
    return this.tradmatchService.getMatchById(rfqId, matchId);
  }
}
