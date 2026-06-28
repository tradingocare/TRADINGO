import { Controller, Get, Post, Patch, Delete, Param, Body, Query, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { RequirementService } from './requirement.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Buyer — Requirements')
@UseGuards(JwtAuthGuard)
@Controller('buyer/requirements')
export class RequirementController {
  constructor(private readonly service: RequirementService) {}

  @Get()
  @ApiOperation({ summary: 'List requirement lists' })
  findAll(@CurrentUser('sub') userId: string, @Query('status') status?: string) {
    return this.service.findAll(userId, status);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get requirement list with items' })
  getById(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.getById(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create requirement list' })
  create(@CurrentUser('sub') userId: string, @Body() body: any) {
    return this.service.create(userId, body);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update requirement list' })
  update(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() body: any) {
    return this.service.update(userId, id, body);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete requirement list' })
  remove(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.remove(userId, id);
  }

  @Post(':id/items')
  @ApiOperation({ summary: 'Add item to requirement list' })
  addItem(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() body: any) {
    return this.service.addItem(userId, id, body);
  }

  @Patch(':id/items/:itemId')
  @ApiOperation({ summary: 'Update requirement list item' })
  updateItem(@CurrentUser('sub') userId: string, @Param('id') id: string, @Param('itemId') itemId: string, @Body() body: any) {
    return this.service.updateItem(userId, id, itemId, body);
  }

  @Delete(':id/items/:itemId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove item from requirement list' })
  removeItem(@CurrentUser('sub') userId: string, @Param('id') id: string, @Param('itemId') itemId: string) {
    return this.service.removeItem(userId, id, itemId);
  }
}
