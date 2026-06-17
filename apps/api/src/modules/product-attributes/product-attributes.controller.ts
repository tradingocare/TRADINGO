import { Controller, Get, Post, Delete, Param, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProductAttributesService } from './product-attributes.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SaveAttributesDto } from './dto/save-attributes.dto';

@ApiTags('Product Attributes')
@UseGuards(JwtAuthGuard)
@Controller('products/:productId/attributes')
export class ProductAttributesController {
  constructor(private readonly service: ProductAttributesService) {}

  @Get()
  @ApiOperation({ summary: 'Get all attributes for a product, grouped by section' })
  async findByProduct(@Param('productId') productId: string) {
    return this.service.findByProduct(productId);
  }

  @Post()
  @ApiOperation({ summary: 'Save attributes for a product (upserts by fieldKey)' })
  async save(@Param('productId') productId: string, @Body() dto: SaveAttributesDto) {
    return this.service.save(productId, dto);
  }

  @Delete(':fieldKey')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a specific attribute' })
  async remove(@Param('productId') productId: string, @Param('fieldKey') fieldKey: string) {
    await this.service.remove(productId, fieldKey);
  }
}
