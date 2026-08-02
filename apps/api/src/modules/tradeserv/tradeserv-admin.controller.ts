import { Controller, Get, Post, Param, Body, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { TradeservService } from './tradeserv.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { PrismaService } from '../../prisma/prisma.service';
import { ProfessionalCompanyStatus } from '@prisma/client';

@ApiTags('TradeServ Admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN', 'SUPER_ADMIN')
@Throttle({ default: { limit: 120, ttl: 60000 } })
@Controller('admin/tradeserv')
export class TradeservAdminController {
  constructor(
    private readonly service: TradeservService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('professionals')
  @ApiOperation({ summary: 'List all professionals (admin)' })
  async listProfessionals(@Query() query: { page?: string; limit?: string; status?: string; search?: string }) {
    return this.service.getAdminProfessionals({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      status: query.status,
      search: query.search,
    });
  }

  @Get('professionals/:id')
  @ApiOperation({ summary: 'Get professional detail (admin)' })
  async getProfessionalDetail(@Param('id') id: string) {
    return this.prisma.company.findUnique({
      where: { id },
      include: {
        professionalServices: true,
        professionalPortfolio: true,
        professionalCertifications: true,
        professionalAvailability: true,
        professionalLanguages: true,
        professionalServiceAreas: true,
        reviewsAsProfessional: { include: { client: { select: { name: true } } }, orderBy: { createdAt: 'desc' }, take: 20 },
        bookingsAsProfessional: { orderBy: { createdAt: 'desc' }, take: 20 },
      },
    });
  }

  @Post('professionals/:id/approve')
  @ApiOperation({ summary: 'Approve a professional' })
  async approveProfessional(@Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.service.approveProfessional(id, ProfessionalCompanyStatus.APPROVED, dto.reason);
  }

  @Post('professionals/:id/reject')
  @ApiOperation({ summary: 'Reject a professional' })
  async rejectProfessional(@Param('id') id: string, @Body() dto: { reason?: string }) {
    return this.service.approveProfessional(id, ProfessionalCompanyStatus.REJECTED, dto.reason);
  }

  @Get('bookings')
  @ApiOperation({ summary: 'List all bookings (admin)' })
  async listBookings(@Query() query: { page?: string; limit?: string; status?: string }) {
    return this.service.getAdminBookings({
      page: query.page ? parseInt(query.page) : 1,
      limit: query.limit ? parseInt(query.limit) : 20,
      status: query.status,
    });
  }

  @Get('bookings/stats')
  @ApiOperation({ summary: 'Get booking stats (admin)' })
  async getBookingStats() {
    return this.service.getAdminBookingStats();
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get TradeServ admin stats' })
  async getStats() {
    const [total, pending, approved, rejected, services, bookings, reviews] = await Promise.all([
      this.prisma.company.count({ where: { professionalType: { not: null } } }),
      this.prisma.company.count({ where: { professionalStatus: ProfessionalCompanyStatus.PENDING_REVIEW } }),
      this.prisma.company.count({ where: { professionalStatus: ProfessionalCompanyStatus.APPROVED } }),
      this.prisma.company.count({ where: { professionalStatus: ProfessionalCompanyStatus.REJECTED } }),
      this.prisma.professionalService.count(),
      this.prisma.booking.count(),
      this.prisma.professionalReview.count(),
    ]);
    return { total, pending, approved, rejected, services, bookings, reviews };
  }
}

