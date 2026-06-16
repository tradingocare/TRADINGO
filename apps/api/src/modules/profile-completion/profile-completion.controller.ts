import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { ProfileCompletionService } from './profile-completion.service';

@ApiTags('Profile Completion')
@Controller('companies/:companyId/profile-completion')
export class ProfileCompletionController {
  constructor(private readonly profileCompletionService: ProfileCompletionService) {}

  @Get()
  @ApiOperation({ summary: 'Get profile completion details' })
  async getDetails(@Param('companyId') companyId: string) {
    return this.profileCompletionService.getDetails(companyId);
  }

  @Post('recalculate')
  @ApiOperation({ summary: 'Recalculate and store profile completion percentage' })
  async recalculate(@Param('companyId') companyId: string) {
    const percentage = await this.profileCompletionService.calculateAndStore(companyId);
    return { percentage };
  }

  @Post('reward')
  @ApiOperation({ summary: 'Reward profile completion with GoCash' })
  async reward(
    @Param('companyId') companyId: string,
    @Body('userId') userId: string,
  ) {
    const rewarded = await this.profileCompletionService.rewardProfileCompletion(companyId, userId);
    return { rewarded };
  }
}
