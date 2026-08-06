import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { RateLimits } from '../../common/constants/rate-limits.const';
import { SellerService } from './seller.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateSellerProfileDto, UpdateSellerDocumentsDto } from './dto';

@ApiTags('Seller')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('seller')
@UseGuards(JwtAuthGuard)
export class SellerController {
  constructor(private readonly sellerService: SellerService) {}

  @Get('profile')
  @ApiOperation({ summary: 'Get seller profile' })
  getProfile(@CurrentUser('sub') userId: string) {
    return this.sellerService.getProfile(userId);
  }

  @Patch('profile')
  @ApiOperation({ summary: 'Update seller profile' })
  updateProfile(@CurrentUser('sub') userId: string, @Body() dto: UpdateSellerProfileDto) {
    return this.sellerService.updateProfile(userId, dto);
  }

  @Patch('documents')
  @ApiOperation({ summary: 'Update seller documents' })
  updateDocuments(@CurrentUser('sub') userId: string, @Body() dto: UpdateSellerDocumentsDto) {
    return this.sellerService.updateDocuments(userId, dto);
  }

  @Post('go-live')
  @ApiOperation({ summary: 'Go live as seller' })
  goLive(@CurrentUser('sub') userId: string) {
    return this.sellerService.goLive(userId);
  }

  @Get('buyers')
  @ApiOperation({ summary: 'Get seller buyers' })
  getBuyers(@CurrentUser('sub') userId: string) {
    return this.sellerService.getBuyers(userId);
  }
}
