import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CertificationsService } from './certifications.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateCertificationDto } from './dto/create-certification.dto';
import { UpdateCertificationDto } from './dto/update-certification.dto';

@ApiTags('Certifications')
@UseGuards(JwtAuthGuard, CompanyOwnerGuard)
@Controller('companies/:companyId/certifications')
export class CertificationsController {
  constructor(private readonly certificationsService: CertificationsService) {}

  @Post()
  @ApiOperation({ summary: 'Upload certification document' })
  async create(
    @Param('companyId') companyId: string,
    @Body() dto: CreateCertificationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.certificationsService.create(companyId, dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'Get all certifications for company' })
  async findAll(@Param('companyId') companyId: string) {
    return this.certificationsService.findAll(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get certification by id' })
  async findById(@Param('id') id: string) {
    return this.certificationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update certification' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateCertificationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.certificationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete certification (admin only)' })
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.certificationsService.remove(id, userId);
  }

  @Patch(':id/review')
  @UseGuards(RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Review certification (admin only)' })
  async review(
    @Param('id') id: string,
    @Body('status') status: 'APPROVED' | 'REJECTED',
    @Body('notes') notes: string | undefined,
    @CurrentUser('sub') userId: string,
  ) {
    return this.certificationsService.review(id, status, notes, userId);
  }
}
