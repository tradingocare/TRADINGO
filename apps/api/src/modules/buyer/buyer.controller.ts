import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { BuyerService } from './buyer.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Buyer Workspace')
@UseGuards(JwtAuthGuard)
@Controller('buyer')
export class BuyerController {
  constructor(private readonly service: BuyerService) {}

  @Get('dashboard')
  @ApiOperation({ summary: 'Buyer dashboard overview' })
  getDashboard(@CurrentUser('sub') userId: string) {
    return this.service.getDashboard(userId);
  }
}
