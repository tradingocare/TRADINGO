import { Controller, Get, Post, Patch, Param, Query, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiQuery } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradeservService } from './tradeserv.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateBookingDto, UpdateBookingStatusDto, CreateReviewDto, CreateBookingPaymentOrderDto, VerifyBookingPaymentDto } from './dto';
import { PrismaService } from '../../prisma/prisma.service';

@ApiTags('TradeServ Bookings')
@Controller('tradeserv/bookings')
@Throttle({ default: { limit: 20, ttl: 60000 } })
export class TradeservBookingController {
  constructor(
    private readonly service: TradeservService,
    private readonly prisma: PrismaService,
  ) {}

  @Post()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a booking' })
  async create(@Body() dto: CreateBookingDto, @CurrentUser('companyId') clientId: string) {
    return this.service.createBooking(clientId, dto);
  }

  @Post(':id/pay')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a payment order for a booking' })
  async createPaymentOrder(
    @Param('id') id: string,
    @Body() dto: CreateBookingPaymentOrderDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.createBookingPaymentOrder(id, companyId, dto.amount, dto.currency);
  }

  @Post(':id/verify')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Verify payment for a booking' })
  async verifyPayment(
    @Param('id') id: string,
    @Body() dto: VerifyBookingPaymentDto,
    @CurrentUser('companyId') companyId: string,
  ) {
    return this.service.verifyBookingPayment(id, companyId, dto);
  }

  @Post('reviews')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a review for a booking' })
  async createReview(@Body() dto: CreateReviewDto, @CurrentUser('companyId') clientId: string, @CurrentUser('sub') userId: string) {
    return this.service.createReview(clientId, userId, dto);
  }

  @Get('reviews/:companyId')
  @ApiOperation({ summary: 'Get reviews for a professional' })
  async getReviews(@Param('companyId') companyId: string) {
    return this.prisma.professionalReview.findMany({
      where: { companyId },
      include: { client: { select: { name: true, slug: true, logo: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get my bookings' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'status', required: false, type: String })
  async list(
    @CurrentUser('companyId') companyId: string,
    @Query('page') page?: string,
    @Query('limit') limit?: string,
    @Query('status') status?: string,
  ) {
    const p = page ? parseInt(page, 10) : 1;
    const l = limit ? parseInt(limit, 10) : 20;
    const [asProfessional, asClient] = await Promise.all([
      this.service.getBookings(companyId, 'professional', p, l, status),
      this.service.getBookings(companyId, 'client', p, l, status),
    ]);
    return {
      asProfessional: asProfessional.data,
      asClient: asClient.data,
      meta: { professional: asProfessional.meta, client: asClient.meta },
    };
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get booking by ID' })
  async getById(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.service.getBookingById(id, userId);
  }

  @Patch(':id/status')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Update booking status' })
  async updateStatus(@Param('id') id: string, @Body() dto: UpdateBookingStatusDto, @CurrentUser('sub') userId: string) {
    return this.service.updateBookingStatus(id, userId, dto);
  }
}
