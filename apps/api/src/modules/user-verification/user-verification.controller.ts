import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { UserVerificationService } from './user-verification.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { SubmitUserVerificationDto } from './dto/submit-user-verification.dto';
import { ReviewUserVerificationDto } from './dto/review-user-verification.dto';

@ApiTags('User Verification')
@Controller('user-verifications')
export class UserVerificationController {
  constructor(private readonly userVerificationService: UserVerificationService) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Submit a user verification request' })
  async submit(@Body() dto: SubmitUserVerificationDto, @CurrentUser('sub') userId: string) {
    return this.userVerificationService.submit(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'List all user verification requests' })
  async findAll(@Query() query: { status?: string; cursor?: string; limit?: number }) {
    return this.userVerificationService.findAll(query);
  }

  @Get('my')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my verification requests' })
  async findMy(@CurrentUser('sub') userId: string) {
    return this.userVerificationService.findByUser(userId);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get a single user verification' })
  async findOne(@Param('id') id: string) {
    return this.userVerificationService.findById(id);
  }

  @Post(':id/review')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Review (approve/reject) a user verification' })
  async review(@Param('id') id: string, @Body() dto: ReviewUserVerificationDto, @CurrentUser('sub') userId: string) {
    return this.userVerificationService.review(id, dto, userId);
  }
}
