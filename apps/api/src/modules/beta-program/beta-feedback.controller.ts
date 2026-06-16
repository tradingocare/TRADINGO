import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetaProgramService } from './beta-program.service';
import { SubmitFeedbackDto } from './dto/submit-feedback.dto';
import { PaginationQueryDto } from './dto/pagination-query.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { FeedbackStatus } from '@prisma/client';

@ApiTags('Beta Feedback')
@Controller('beta-feedback')
export class BetaFeedbackController {
  constructor(private readonly betaProgramService: BetaProgramService) {}

  @Post()
  @Public()
  @ApiOperation({ summary: 'Submit feedback (anonymous allowed)' })
  async submit(
    @Body() dto: SubmitFeedbackDto,
    @CurrentUser('sub') userId?: string,
    @Req() req?: any,
  ) {
    const companyId = req?.user?.companyId;
    return this.betaProgramService.submitFeedback(dto, userId, companyId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List feedback' })
  async findAll(@Query() query: PaginationQueryDto) {
    return this.betaProgramService.getFeedback(query);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get feedback statistics' })
  async getStats() {
    return this.betaProgramService.getFeedbackStats();
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update feedback status' })
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: FeedbackStatus,
  ) {
    return this.betaProgramService.updateFeedbackStatus(id, status);
  }
}
