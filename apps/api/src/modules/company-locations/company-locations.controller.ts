import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { CompanyLocationsService } from './company-locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CompanyOwnerGuard } from '../../common/guards/company-owner.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCompanyLocationDto } from './dto/create-company-location.dto';
import { UpdateCompanyLocationDto } from './dto/update-company-location.dto';
import { RateLimits } from '../../common/constants/rate-limits.const';

@ApiTags('Company Locations')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('company-locations')
@UseGuards(JwtAuthGuard)
export class CompanyLocationsController {
  constructor(private readonly companyLocationsService: CompanyLocationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a company location' })
  async create(@Body() dto: CreateCompanyLocationDto, @CurrentUser('sub') userId: string) {
    return this.companyLocationsService.create(dto, userId);
  }

  @Get('company/:companyId')
  @ApiOperation({ summary: 'Get locations by company' })
  @UseGuards(CompanyOwnerGuard)
  async findByCompany(@Param('companyId') companyId: string) {
    return this.companyLocationsService.findByCompany(companyId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get company location by ID' })
  async findOne(@Param('id') id: string) {
    return this.companyLocationsService.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a company location' })
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyLocationDto, @CurrentUser('sub') userId: string) {
    return this.companyLocationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete a company location' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.companyLocationsService.remove(id, userId);
  }
}
