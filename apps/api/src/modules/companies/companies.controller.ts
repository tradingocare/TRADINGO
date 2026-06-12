import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompaniesService } from './companies.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@ApiTags('Companies')
@Controller('companies')
export class CompaniesController {
  constructor(private readonly companiesService: CompaniesService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create company' })
  async create(@Body() dto: CreateCompanyDto, @CurrentUser('sub') userId: string) {
    return this.companiesService.create(dto, userId);
  }

  @Get()
  @Public()
  @ApiOperation({ summary: 'List companies' })
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
  @ApiOperation({ summary: 'Search companies' })
  async search(@Query('q') query: string, @Query('businessType') businessType?: string, @Query('city') city?: string, @Query('state') state?: string) {
    return this.companiesService.searchCompanies(query, { businessType, city, state });
  }

  @Get(':slug')
  @Public()
  @ApiOperation({ summary: 'Get company by slug' })
  async findBySlug(@Param('slug') slug: string) {
    return this.companiesService.findBySlug(slug);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update company' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyDto, @CurrentUser('sub') userId: string) {
    return this.companiesService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete company' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.companiesService.remove(id, userId);
  }

  @Post(':id/owners')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add company owner' })
  async addOwner(@Param('id') id: string, @Body('userId') newOwnerUserId: string, @CurrentUser('sub') userId: string) {
    return this.companiesService.addOwner(id, newOwnerUserId, userId);
  }

  @Delete(':id/owners/:ownerUserId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove company owner' })
  async removeOwner(@Param('id') id: string, @Param('ownerUserId') ownerUserId: string, @CurrentUser('sub') userId: string) {
    await this.companiesService.removeOwner(id, ownerUserId, userId);
  }

  @Get(':id/profile-completion')
  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @ApiOperation({ summary: 'Get profile completion percentage' })
  async getProfileCompletion(@Param('id') id: string) {
    return this.companiesService.getProfileCompletion(id);
  }

  @Get(':id/profile-completion/details')
  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @ApiOperation({ summary: 'Get profile completion details' })
  async getProfileCompletionDetails(@Param('id') id: string) {
    return this.companiesService.getProfileCompletionDetails(id);
  }

  @Get(':id/onboarding')
  @UseGuards(JwtAuthGuard, CompanyOwnerGuard)
  @ApiOperation({ summary: 'Get onboarding status' })
  async getOnboarding(@Param('id') id: string) {
    return this.companiesService.getOnboardingStatus(id);
  }

  @Patch(':id/subscription')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Update subscription (admin only)' })
  async updateSubscription(
    @Param('id') id: string,
    @Body('plan') plan: string,
    @Body('status') status: string,
    @Body('expiresAt') expiresAt: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.companiesService.updateSubscription(id, plan, status, expiresAt, userId);
  }

  @Post(':id/assign-rm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Assign RM to company' })
  async assignRm(
    @Param('id') id: string,
    @Body('rmUserId') rmUserId: string,
    @CurrentUser('sub') userId: string,
  ) {
    return this.companiesService.assignRm(id, rmUserId, userId);
  }

  @Delete(':id/assign-rm')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Remove RM assignment' })
  async removeRm(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.companiesService.removeRm(id, userId);
  }
}
