import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { BetaProgramService } from './beta-program.service';
import { CreateInviteDto } from './dto/create-invite.dto';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@ApiTags('Beta Invites')
@Controller('beta-invites')
export class BetaInvitesController {
  constructor(private readonly betaProgramService: BetaProgramService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a beta invite' })
  async create(@Body() dto: CreateInviteDto, @CurrentUser('sub') userId: string) {
    return this.betaProgramService.createInvite(dto, userId);
  }

  @Get()
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List beta invites' })
  async findAll(
    @Query('companyId') companyId?: string,
    @Query('status') status?: string,
  ) {
    return this.betaProgramService.getInvites(companyId, status);
  }

  @Get('stats')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get invite statistics' })
  async getStats() {
    return this.betaProgramService.getInviteStats();
  }

  @Post(':token/accept')
  @Public()
  @ApiOperation({ summary: 'Accept invite using token' })
  async accept(@Param('token') token: string, @Body('companyId') companyId: string) {
    return this.betaProgramService.acceptInvite(token, companyId);
  }

  @Patch(':id/revoke')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Revoke a beta invite' })
  async revoke(@Param('id') id: string) {
    return this.betaProgramService.revokeInvite(id);
  }
}
