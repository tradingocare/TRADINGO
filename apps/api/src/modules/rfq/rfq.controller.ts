import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RfqService } from './rfq.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRfqDto } from './dto/create-rfq.dto';
import { UpdateRfqDto } from './dto/update-rfq.dto';
import { RfqQueryDto } from './dto/rfq-query.dto';
import { RfqSearchDto } from './dto/rfq-search.dto';

@ApiTags('RFQ')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/rfq')
export class RfqController {
  constructor(private readonly rfqService: RfqService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new RFQ (draft)' })
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateRfqDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.create(companyId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List RFQs for company' })
  async findAll(
    @Param('companyId') companyId: string,
    @Query() query: RfqQueryDto,
  ) {
    return this.rfqService.findAll(companyId, query);
  }

  @Get('search')
  @ApiOperation({ summary: 'Search RFQs by number, title, category, status, date range' })
  async search(
    @Param('companyId') companyId: string,
    @Query() query: RfqSearchDto,
  ) {
    return this.rfqService.search(companyId, query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get RFQ by id' })
  async findById(@Param('id') id: string) {
    return this.rfqService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update RFQ (draft/expired only)' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateRfqDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete RFQ (draft/cancelled only)' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.rfqService.remove(id, userId);
  }

  @Post(':id/publish')
  @ApiOperation({ summary: 'Publish RFQ (consumes credits)' })
  async publish(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.publish(id, userId);
  }

  @Post(':id/close')
  @ApiOperation({ summary: 'Close an active RFQ' })
  async close(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.close(id, userId);
  }

  @Post(':id/reopen')
  @ApiOperation({ summary: 'Reopen a closed RFQ (within 7 days)' })
  async reopen(
    @Param('id') id: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.reopen(id, userId);
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an active RFQ' })
  async cancel(
    @Param('id') id: string,
    @Body('reason') reason: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.cancel(id, reason, userId);
  }

  @Get('credits/balance')
  @ApiOperation({ summary: 'Get RFQ credit balance' })
  async getCreditBalance(@Param('companyId') companyId: string) {
    const balance = await this.rfqService.getCreditBalance(companyId);
    return { balance };
  }

  @Post('credits/purchase-pack')
  @ApiOperation({ summary: 'Purchase an RFQ credit pack (₹999 for 5 credits)' })
  async purchaseCreditPack(
    @Param('companyId') companyId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.rfqService.purchaseCreditPack(companyId, userId);
  }

  @Post('credits/admin/grant')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Grant credits to company (admin only)' })
  async grantCredits(
    @Param('companyId') companyId: string,
    @Body('amount') amount: number,
    @CurrentUser('sub') userId: string,
  ) {
    await this.rfqService.adminGrantCredits(companyId, amount, userId);
    return { message: `${amount} credits granted` };
  }
}
