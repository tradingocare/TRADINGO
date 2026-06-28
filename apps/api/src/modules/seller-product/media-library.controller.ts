import { Controller, Get, Post, Patch, Delete, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { MediaLibraryService } from './media-library.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Seller Media Library')
@UseGuards(JwtAuthGuard)
@Controller('seller/media')
export class MediaLibraryController {
  constructor(private readonly service: MediaLibraryService) {}

  @Get()
  @ApiOperation({ summary: 'List media' })
  listMedia(@CurrentUser('sub') userId: string, @Query('folderId') folderId?: string, @Query('page') page?: string, @Query('limit') limit?: string) {
    return this.service.listMedia(userId, folderId, page ? Number(page) : undefined, limit ? Number(limit) : undefined);
  }

  @Post()
  @ApiOperation({ summary: 'Upload media' })
  uploadMedia(@CurrentUser('sub') userId: string, @Body() dto: any) {
    return this.service.uploadMedia(userId, dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update media' })
  updateMedia(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body() dto: any) {
    return this.service.updateMedia(userId, id, dto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete media' })
  deleteMedia(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.deleteMedia(userId, id);
  }

  @Post('reorder')
  @ApiOperation({ summary: 'Reorder media' })
  reorderMedia(@CurrentUser('sub') userId: string, @Body() dto: { items: { id: string; sortOrder: number }[] }) {
    return this.service.reorderMedia(userId, dto.items);
  }

  @Get('folders')
  @ApiOperation({ summary: 'List folder tree' })
  listFolders(@CurrentUser('sub') userId: string) {
    return this.service.listFolders(userId);
  }

  @Post('folders')
  @ApiOperation({ summary: 'Create folder' })
  createFolder(@CurrentUser('sub') userId: string, @Body() dto: { name: string; parentId?: string }) {
    return this.service.createFolder(userId, dto);
  }

  @Patch('folders/:id')
  @ApiOperation({ summary: 'Rename folder' })
  renameFolder(@CurrentUser('sub') userId: string, @Param('id') id: string, @Body('name') name: string) {
    return this.service.renameFolder(userId, id, name);
  }

  @Delete('folders/:id')
  @ApiOperation({ summary: 'Delete folder' })
  deleteFolder(@CurrentUser('sub') userId: string, @Param('id') id: string) {
    return this.service.deleteFolder(userId, id);
  }
}
