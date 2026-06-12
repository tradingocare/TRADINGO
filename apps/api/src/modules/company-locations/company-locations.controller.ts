import { Controller, Get, Post, Patch, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { CompanyLocationsService } from './company-locations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateCompanyLocationDto } from './dto/create-company-location.dto';
import { UpdateCompanyLocationDto } from './dto/update-company-location.dto';

@Controller('company-locations')
@UseGuards(JwtAuthGuard)
export class CompanyLocationsController {
  constructor(private readonly companyLocationsService: CompanyLocationsService) {}

  @Post()
  async create(@Body() dto: CreateCompanyLocationDto, @CurrentUser('sub') userId: string) {
    return this.companyLocationsService.create(dto, userId);
  }

  @Get('company/:companyId')
  async findByCompany(@Param('companyId') companyId: string) {
    return this.companyLocationsService.findByCompany(companyId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.companyLocationsService.findById(id);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateCompanyLocationDto, @CurrentUser('sub') userId: string) {
    return this.companyLocationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.companyLocationsService.remove(id, userId);
  }
}
