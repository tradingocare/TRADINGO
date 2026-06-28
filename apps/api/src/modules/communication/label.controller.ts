import { Controller, Get, Post, Patch, Delete, Param, Body, HttpCode, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { LabelService } from './label.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Communication Hub — Labels')
@UseGuards(JwtAuthGuard)
@Controller('communication')
export class LabelController {
  constructor(private readonly service: LabelService) {}

  @Get('labels')
  @ApiOperation({ summary: 'List conversation labels' })
  findAll(@CurrentUser('sub') _userId: string, @CurrentUser('companyId') companyId: string) {
    return this.service.findAll(companyId);
  }

  @Post('labels')
  @ApiOperation({ summary: 'Create a label' })
  create(@CurrentUser('companyId') companyId: string, @Body() body: { name: string; color?: string }) {
    return this.service.create(companyId, body);
  }

  @Patch('labels/:id')
  @ApiOperation({ summary: 'Update a label' })
  update(@CurrentUser('companyId') companyId: string, @Param('id') id: string, @Body() body: { name?: string; color?: string }) {
    return this.service.update(id, companyId, body);
  }

  @Delete('labels/:id')
  @HttpCode(204)
  @ApiOperation({ summary: 'Delete a label' })
  remove(@CurrentUser('companyId') companyId: string, @Param('id') id: string) {
    return this.service.remove(id, companyId);
  }

  @Post('conversations/:conversationId/labels/:labelId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Assign label to conversation' })
  assignLabel(@Param('conversationId') conversationId: string, @Param('labelId') labelId: string) {
    return this.service.assignLabel(conversationId, labelId);
  }

  @Delete('conversations/:conversationId/labels/:labelId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Remove label from conversation' })
  removeLabel(@Param('conversationId') conversationId: string, @Param('labelId') labelId: string) {
    return this.service.removeLabel(conversationId, labelId);
  }
}
