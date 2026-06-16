import {
  Controller,
  Get,
  Post,
  UseGuards,
  Req,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetaProgramService } from './beta-program.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';

@ApiTags('Beta Onboarding')
@Controller('beta-onboarding')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class BetaOnboardingController {
  constructor(private readonly betaProgramService: BetaProgramService) {}

  @Get('status')
  @ApiOperation({ summary: 'Get onboarding status' })
  async getStatus(@Req() req: any) {
    return this.betaProgramService.getOnboardingStatus(req.user.companyId);
  }

  @Post('advance')
  @ApiOperation({ summary: 'Advance to next onboarding step' })
  async advanceStep(@Req() req: any) {
    return this.betaProgramService.advanceOnboardingStep(req.user.companyId);
  }

  @Get('product-import')
  @ApiOperation({ summary: 'Get product import guide' })
  async getProductImportGuide(@Req() req: any) {
    return this.betaProgramService.getProductImportGuide(req.user.companyId);
  }

  @Get('rfq')
  @ApiOperation({ summary: 'Get RFQ onboarding guide' })
  async getRfqGuide(@Req() req: any) {
    return this.betaProgramService.getRfqGuide(req.user.companyId);
  }
}
