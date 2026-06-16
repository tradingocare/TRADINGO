import { Controller, Post, Param, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductLocationService } from './product-location.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateProductLocationDto } from './dto/update-product-location.dto';

@ApiTags('Product Location')
@UseGuards(JwtAuthGuard)
@Controller('products')
export class ProductLocationController {
  constructor(private readonly service: ProductLocationService) {}

  @Post(':productId/location')
  @ApiOperation({ summary: 'Update product geo location and sync to location index' })
  async update(
    @Param('productId') productId: string,
    @Body() dto: UpdateProductLocationDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.service.update(productId, dto);
  }
}
