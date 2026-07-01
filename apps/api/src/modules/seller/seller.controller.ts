import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { SellerService } from './seller.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('seller')
@UseGuards(JwtAuthGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('profile')
  getProfile(@CurrentUser('sub') userId: string) {
    return this.sellerService.getProfile(userId);
  }

  @Patch('profile')
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: any) {
    return this.sellerService.updateProfile(userId, dto);
  }

  @Patch('documents')
  updateDocuments(@CurrentUser('sub') userId: string, @Body() docs: Record<string, string>) {
    return this.sellerService.updateDocuments(userId, docs);
  }

  @Post('go-live')
  goLive(@CurrentUser('sub') userId: string) {
    return this.sellerService.goLive(userId);
  }

  @Get('buyers')
  getBuyers(@CurrentUser('sub') userId: string) {
    return this.sellerService.getBuyers(userId);
  }
}
