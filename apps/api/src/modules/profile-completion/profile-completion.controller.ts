import { Controller, Get, Post, Param, Body, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AuthGuard } from '@nestjs/passport';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileCompletionService } from './profile-completion.service';
import { RateLimits } from '../../common/constants/rate-limits.const';

@ApiTags('Profile Completion')
@Controller('companies/:companyId/profile-completion')
@UseGuards(AuthGuard('jwt'), RolesGuard)
@Throttle(RateLimits.ADMIN_WRITE)
export class ProfileCompletionController {
  constructor(private readonly profileCompletionService: ProfileCompletionService) {}

  @Get()
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Get profile completion details' })
  async getDetails(@Param('companyId') companyId: string) {
    return this.profileCompletionService.getDetails(companyId);
  }

  @Post('recalculate')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Recalculate and store profile completion percentage' })
  async recalculate(@Param('companyId') companyId: string) {
    const percentage = await this.profileCompletionService.calculateAndStore(companyId);
    return { percentage };
  }

  @Post('reward')
  @Roles('ADMIN', 'SUPER_ADMIN')
  @ApiOperation({ summary: 'Reward profile completion with GoCash' })
  async reward(
    @Param('companyId') companyId: string,
    @Body('userId') userId: string,
  ) {
    const rewarded = await this.profileCompletionService.rewardProfileCompletion(companyId, userId);
    return { rewarded };
  }
}
