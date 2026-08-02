import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductLocationService } from './product-location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProductLocationDto } from './dto/update-product-location.dto';
import { RateLimits } from '../../common/constants/rate-limits.const';

@ApiTags('Product Location')
@UseGuards(JwtAuthGuard)
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('products')
export class ProductLocationController {
  constructor(private readonly service: ProductLocationService) {}

  @Post(':productId/location')
  @ApiOperation({ summary: 'Update product geo location and sync to location index' })
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductLocationDto,
    @CurrentUser('sub') _userId: string,
  ) {
    return this.service.update(productId, dto);
  }
}
