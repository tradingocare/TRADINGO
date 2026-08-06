import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ProductCompletenessService } from './product-completeness.service';

class BulkCompletenessDto {
  productIds: string[];
}

@ApiTags('Product Completeness')
@Controller('ai/completeness')
@UseGuards(AuthGuard('jwt'), RolesGuard)
export class ProductCompletenessController {
  constructor(private readonly service: ProductCompletenessService) {}

  @ApiOperation({ summary: 'Get product completeness score' })
  @Get(':productId')
  @Roles('SELLER', 'BUYER', 'ADMIN', 'SUPER_ADMIN')
  getCompleteness(@Param('productId') productId: string) {
    return this.service.getCompleteness(productId);
  }

  @ApiOperation({ summary: 'Get bulk product completeness scores' })
  @Post('bulk')
  @Roles('SELLER', 'ADMIN', 'SUPER_ADMIN')
  getBulkCompleteness(@Body() dto: BulkCompletenessDto) {
    return this.service.getBulkCompleteness(dto.productIds);
  }
}
