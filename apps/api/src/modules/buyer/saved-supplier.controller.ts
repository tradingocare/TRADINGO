import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { SavedSupplierService } from './saved-supplier.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SaveSupplierDto, UpdateSavedSupplierDto } from './dto';

@ApiTags('Buyer — Saved Suppliers')
@Throttle(RateLimits.WRITE_GENERAL)
@UseGuards(JwtAuthGuard)
@Controller('buyer/saved-suppliers')
export class SavedSupplierController {
  constructor(private readonly service: SavedSupplierService) {}

  @Get()
  @ApiOperation({ summary: 'List saved suppliers' })
  findAll(@CurrentUser('sub') userId: string) {
    return this.service.findAll(userId);
  }

  @Post()
  @ApiOperation({ summary: 'Save a supplier' })
  save(@CurrentUser('sub') userId: string, @Body() dto: SaveSupplierDto) {
    return this.service.save(userId, dto.companyId, dto.notes, dto.tags);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update saved supplier notes/tags' })
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: UpdateSavedSupplierDto) {
    return this.service.update(userId, id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove saved supplier' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  @Get('check/:companyId')
  @ApiOperation({ summary: 'Check if supplier is saved' })
  check(@CurrentUser('sub') userId: string, @Param('companyId') companyId: string) {
    return this.service.check(userId, companyId);
  }
}
