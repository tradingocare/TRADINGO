import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradeservService } from './tradeserv.service';
import { PrismaService } from '../../prisma/prisma.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RegisterProfessionalDto, UpdateCompanyProfileDto, CreateProfessionalServiceDto, UpdateProfessionalServiceDto, CreatePortfolioItemDto, UpdatePortfolioItemDto, CreateCertificationDto, UpdateCertificationDto, SetAvailabilityDto, AddLanguageDto, AddServiceAreaDto } from './dto';

@ApiTags('TradeServ')
@Controller('tradeserv')
@Throttle({ default: { limit: 30, ttl: 60000 } })
export class TradeservController {
  constructor(
    private readonly service: TradeservService,
    private readonly prisma: PrismaService,
  ) {}

  @Post('register')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Register as a professional' })
  async register(@Body() dto: RegisterProfessionalDto, @CurrentUser('sub') userId: string) {
    return this.service.registerProfessional(userId, dto);
  }

  @Get('professionals/:slug')
  @Public()
  @ApiOperation({ summary: 'Get full professional profile by slug' })
  async getProfile(@Param('slug') slug: string) {
    return this.service.getProfessionalBySlug(slug);
  }

  @Get('professionals/:slug/summary')
  @Public()
  @ApiOperation({ summary: 'Get professional summary by slug' })
  async getSummary(@Param('slug') slug: string) {
    return this.service.getProfessionalSummary(slug);
  }

  @Get('categories')
  @Public()
  @ApiOperation({ summary: 'Get professional service categories' })
  async getCategories() {
    return this.service.getProfessionalCategories();
  }

  @Get('categories/enriched')
  @Public()
  @ApiOperation({ summary: 'Get professional categories enriched with catalog mappings' })
  async getEnrichedCategories() {
    return this.service.getProfessionalCategories(true);
  }

  @Get('categories/resolve/:name')
  @Public()
  @ApiOperation({ summary: 'Resolve a free-text category name to Master Catalog' })
  async resolveCategory(@Param('name') name: string) {
    return this.service.resolveServiceCategory(decodeURIComponent(name));
  }

  @Get('services/:id/enriched')
  @Public()
  @ApiOperation({ summary: 'Get a service with catalog category resolution' })
  async getEnrichedService(@Param('id') id: string) {
    return this.service.getEnrichedService(id);
  }

  @Get('featured')
  @Public()
  @ApiOperation({ summary: 'Get featured professionals' })
  async getFeatured(@Query('limit') limit?: string) {
    return this.service.getFeaturedProfessionals(limit ? parseInt(limit) : 10);
  }

  @Patch('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update professional company profile' })
  async updateProfile(@Body() dto: UpdateCompanyProfileDto, @CurrentUser('companyId') companyId: string) {
    return this.service.updateCompanyProfile(companyId, dto as any);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my professional profile' })
  async getMyProfile(@CurrentUser('companyId') companyId: string) {
    return this.prisma.company.findUnique({ where: { id: companyId }, include: { professionalServices: { where: { isActive: true } }, professionalPortfolio: true, professionalCertifications: true, professionalAvailability: true, professionalLanguages: true, professionalServiceAreas: true } });
  }

  @Get('dashboard')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get professional dashboard stats' })
  async getDashboard(@CurrentUser('companyId') companyId: string) {
    return this.service.getDashboardStats(companyId);
  }

  @Post('services')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a service' })
  async addService(@Body() dto: CreateProfessionalServiceDto, @CurrentUser('companyId') companyId: string) {
    return this.service.addService(companyId, dto);
  }

  @Get('services')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my services' })
  async listServices(@CurrentUser('companyId') companyId: string) {
    return this.prisma.professionalService.findMany({ where: { companyId }, orderBy: { sortOrder: 'asc' } });
  }

  @Patch('services/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update a service' })
  async updateService(@Param('id') id: string, @Body() dto: UpdateProfessionalServiceDto, @CurrentUser('companyId') companyId: string) {
    return this.service.updateService(id, companyId, dto);
  }

  @Delete('services/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete a service' })
  async deleteService(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.deleteService(id, companyId);
  }

  @Post('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add portfolio item' })
  async addPortfolio(@Body() dto: CreatePortfolioItemDto, @CurrentUser('companyId') companyId: string) {
    return this.service.addPortfolioItem(companyId, dto);
  }

  @Get('portfolio')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my portfolio items' })
  async listPortfolio(@CurrentUser('companyId') companyId: string) {
    return this.prisma.professionalPortfolio.findMany({ where: { companyId }, orderBy: { sortOrder: 'asc' } });
  }

  @Patch('portfolio/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update portfolio item' })
  async updatePortfolio(@Param('id') id: string, @Body() dto: UpdatePortfolioItemDto, @CurrentUser('companyId') companyId: string) {
    return this.service.updatePortfolioItem(id, companyId, dto);
  }

  @Delete('portfolio/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete portfolio item' })
  async deletePortfolio(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.deletePortfolioItem(id, companyId);
  }

  @Post('certifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add certification' })
  async addCertification(@Body() dto: CreateCertificationDto, @CurrentUser('companyId') companyId: string) {
    return this.service.addCertification(companyId, dto);
  }

  @Get('certifications')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List my certifications' })
  async listCertifications(@CurrentUser('companyId') companyId: string) {
    return this.prisma.professionalCertification.findMany({ where: { companyId }, orderBy: { issueDate: 'desc' } });
  }

  @Patch('certifications/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update certification' })
  async updateCertification(@Param('id') id: string, @Body() dto: UpdateCertificationDto, @CurrentUser('companyId') companyId: string) {
    return this.service.updateCertification(id, companyId, dto);
  }

  @Delete('certifications/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Delete certification' })
  async deleteCertification(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.deleteCertification(id, companyId);
  }

  @Post('availability')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Set availability slot' })
  async setAvailability(@Body() dto: SetAvailabilityDto, @CurrentUser('companyId') companyId: string) {
    return this.service.setAvailability(companyId, dto);
  }

  @Get('availability')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my availability' })
  async getAvailability(@CurrentUser('companyId') companyId: string) {
    return this.prisma.professionalAvailability.findMany({ where: { companyId }, orderBy: { dayOfWeek: 'asc' } });
  }

  @Post('languages')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add a language' })
  async addLanguage(@Body() dto: AddLanguageDto, @CurrentUser('companyId') companyId: string) {
    return this.service.addLanguage(companyId, dto);
  }

  @Delete('languages/:language')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove a language' })
  async removeLanguage(@Param('language') language: string, @CurrentUser('companyId') companyId: string) {
    return this.service.removeLanguage(companyId, language);
  }

  @Post('service-areas')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Add service area' })
  async addServiceArea(@Body() dto: AddServiceAreaDto, @CurrentUser('companyId') companyId: string) {
    return this.service.addServiceArea(companyId, dto);
  }

  @Delete('service-areas/:id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Remove service area' })
  async removeServiceArea(@Param('id') id: string, @CurrentUser('companyId') companyId: string) {
    return this.service.removeServiceArea(id, companyId);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get professional analytics' })
  async getAnalytics(@CurrentUser('companyId') companyId: string) {
    return this.service.getAnalytics(companyId);
  }

  @Get('settings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get professional settings' })
  async getSettings(@CurrentUser('companyId') companyId: string) {
    return this.service.getSettings(companyId);
  }

  @Patch('settings')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update professional settings' })
  async updateSettings(@Body() body: Record<string, unknown>, @CurrentUser('companyId') companyId: string) {
    return this.service.updateSettings(companyId, body);
  }
}
