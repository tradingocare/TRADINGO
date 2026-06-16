import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { ProductOnboardingService } from './product-onboarding.service';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { CurrentUser } from '../common/decorators/current-user.decorator';
import { CreateDraftDto } from './dto/create-draft.dto';
import { UpdateDraftDto } from './dto/update-draft.dto';
import { DraftStatus } from '@prisma/client';

@Controller('product-onboarding')
@UseGuards(JwtAuthGuard)
export class ProductOnboardingController {
  constructor(private readonly onboardingService: ProductOnboardingService) {}

  @Post('draft')
  async createDraft(@Body() dto: CreateDraftDto, @CurrentUser('sub') userId: string) {
    return this.onboardingService.createDraft(userId, dto);
  }

  @Get('draft/:id')
  async getDraft(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.onboardingService.getDraft(id, userId);
  }

  @Patch('draft/:id')
  async updateDraft(@Param('id') id: string, @Body() dto: UpdateDraftDto, @CurrentUser('sub') userId: string) {
    return this.onboardingService.updateDraft(id, userId, dto);
  }

  @Delete('draft/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteDraft(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.onboardingService.deleteDraft(id, userId);
  }

  @Post('draft/:id/submit')
  @HttpCode(HttpStatus.CREATED)
  async submitDraft(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.onboardingService.submitDraft(id, userId);
  }

  @Post('draft/:id/auto-save')
  async autoSave(@Param('id') id: string, @Body() dto: UpdateDraftDto, @CurrentUser('sub') userId: string) {
    return this.onboardingService.autoSave(id, userId, dto);
  }

  @Get('drafts')
  async listDrafts(
    @CurrentUser('sub') userId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: DraftStatus,
  ) {
    return this.onboardingService.listDrafts(userId, page ? parseInt(page, 10) : 1, limit ? parseInt(limit, 10) : 20, status);
  }

  @Get('draft/:id/completeness')
  async getCompleteness(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.onboardingService.calculateCompleteness(id, userId);
  }

  @Get('templates/:categoryId')
  async getTemplate(@Param('categoryId') categoryId: string) {
    return this.onboardingService.getAttributeTemplate(categoryId);
  }

  @Post('templates/:categoryId')
  async createOrUpdateTemplate(
    @Param('categoryId') categoryId: string,
    @Body('name') name: string,
    @Body('fields') fields: any[],
  ) {
    return this.onboardingService.createOrUpdateTemplate(categoryId, name, fields);
  }
}
