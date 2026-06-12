import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  async create(@Body() dto: CreateCompanyDto, @CurrentUser('sub') userId: string) {
    return this.companiesService.create(dto, userId);
  }

  @Get()
  @Public()
  async findAll(@Query() query: {
    cursor?: string;
    limit?: number;
    search?: string;
    businessType?: string;
    status?: string;
    verificationLevel?: string;
    organizationId?: string;
    ownerId?: string;
  }) {
    return this.companiesService.findAll(query);
  }

  @Get('search')
  @Public()
  async search(@Query('q') query: string, @Query('businessType') businessType?: string, @Query('city') city?: string, @Query('state') state?: string) {
    return this.companiesService.searchCompanies(query, { businessType, city, state });
  }

  @Get(':slug')
  @Public()
  async findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @CurrentUser('sub') userId: string) {
    return this.companiesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.companiesService.remove(id, userId);
  }

  @Post(':id/owners')
  @UseGuards(JwtAuthGuard)
  async addOwner(@Param('id') id: string, @Body('userId') newOwnerUserId: string, @CurrentUser('sub') userId: string) {
    return this.companiesService.addOwner(id, newOwnerUserId, userId);
  }

  @Delete(':id/owners/:ownerUserId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeOwner(@Param('id') id: string, @Param('ownerUserId') ownerUserId: string, @CurrentUser('sub') userId: string) {
    await this.companiesService.removeOwner(id, ownerUserId, userId);
  }
}
