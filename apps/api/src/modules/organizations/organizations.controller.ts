import { Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { OrganizationsService } from './organizations.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { UpdateOrganizationDto } from './dto/update-organization.dto';
import { InviteMemberDto } from './dto/invite-member.dto';

@Controller('organizations')
@UseGuards(JwtAuthGuard)
export class OrganizationsController {
  constructor(private readonly organizationsService: OrganizationsService) {}

  @Post()
  async create(@Body() dto: CreateOrganizationDto, @CurrentUser('sub') userId: string) {
    return this.organizationsService.create(dto, userId);
  }

  @Get()
  async findAll(@CurrentUser('sub') userId: string, @Query() query: { cursor?: string; limit?: number; search?: string }) {
    return this.organizationsService.findAll(userId, query);
  }

  @Get('invitations')
  async getMyInvitations(@CurrentUser('sub') userId: string) {
    return this.organizationsService.getUserInvitations(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.findById(id, userId);
  }

  @Patch(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateOrganizationDto, @CurrentUser('sub') userId: string) {
    return this.organizationsService.update(id, dto, userId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.organizationsService.remove(id, userId);
  }

  @Get(':id/members')
  async getMembers(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.getMembers(id, userId);
  }

  @Post(':id/members/invite')
  async inviteMember(@Param('id') id: string, @Body() dto: InviteMemberDto, @CurrentUser('sub') userId: string) {
    return this.organizationsService.inviteMember(id, dto, userId);
  }

  @Delete(':id/members/:memberId')
  @HttpCode(HttpStatus.NO_CONTENT)
  async removeMember(@Param('id') id: string, @Param('memberId') memberId: string, @CurrentUser('sub') userId: string) {
    await this.organizationsService.removeMember(id, memberId, userId);
  }

  @Post(':id/members/transfer/:newOwnerUserId')
  @HttpCode(HttpStatus.OK)
  async transferOwnership(@Param('id') id: string, @Param('newOwnerUserId') newOwnerUserId: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.transferOwnership(id, newOwnerUserId, userId);
  }

  @Get(':id/invitations')
  async getInvitations(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.getPendingInvitations(id, userId);
  }

  @Post('invitations/:token/accept')
  @HttpCode(HttpStatus.OK)
  async acceptInvitation(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    return this.organizationsService.acceptInvitation(token, userId);
  }

  @Post('invitations/:token/reject')
  @HttpCode(HttpStatus.NO_CONTENT)
  async rejectInvitation(@Param('token') token: string, @CurrentUser('sub') userId: string) {
    await this.organizationsService.rejectInvitation(token, userId);
  }
}
