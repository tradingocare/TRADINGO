import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';
import { RateLimits } from '../../common/constants/rate-limits.const';

@ApiTags('Organizations')
@Throttle(RateLimits.WRITE_GENERAL)
@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  @ApiOperation({ summary: 'Create an organization' })
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser('sub') userId: string) {
    return this.organizationsService.create(dto, userId);
  }

  @Get()
  @ApiOperation({ summary: 'List user organizations' })
  async findAll(@CurrentUser('sub') userId: string, @Query() query: { cursor?: string; limit?: number; search?: string }) {
    return this.organizationsService.findAll(userId, query);
  }

  @Get('invitations')
  @ApiOperation({ summary: 'Get user invitations' })
  async getMyInvitations(@CurrentUser('sub') userId: string) {
    return this.organizationsService.getUserInvitations(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get organization by ID' })
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.findById(id, userId);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update an organization' })
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto, @CurrentUser('sub') userId: string) {
    return this.organizationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete an organization' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.organizationsService.remove(id, userId);
  }

  @Get(':id/members')
  @ApiOperation({ summary: 'Get organization members' })
  async getMembers(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.getMembers(id, userId);
  }

  @Post(':id/members/invite')
  @ApiOperation({ summary: 'Invite organization member' })
  async inviteMember(@Param('id') id: string, @Body() dto: InviteMemberDto, @CurrentUser('sub') userId: string) {
    return this.organizationsService.inviteMember(id, dto, userId);
  }

  @Delete(':id/members/:memberId')
  @ApiOperation({ summary: 'Remove organization member' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser('sub') userId: string) {
    await this.organizationsService.removeMember(id, memberId, userId);
  }

  @Post(':id/members/transfer/:newOwnerUserId')
  @ApiOperation({ summary: 'Transfer organization ownership' })
  @HttpCode(HttpStatus.OK)
  async transferOwnership(@Param('id') id: string, @Param('newOwnerUserId') newOwnerUserId: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.transferOwnership(id, newOwnerUserId, userId);
  }

  @Get(':id/invitations')
  @ApiOperation({ summary: 'Get organization invitations' })
  async getInvitations(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.getPendingInvitations(id, userId);
  }

  @Post('invitations/:token/accept')
  @ApiOperation({ summary: 'Accept organization invitation' })
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.acceptInvitation(token, userId);
  }

  @Post('invitations/:token/reject')
  @ApiOperation({ summary: 'Reject organization invitation' })
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectInvitation(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    await this.organizationsService.rejectInvitation(token, userId);
  }
}
