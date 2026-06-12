import { Controller, Get, Patch, Delete, Param, Body, Query, UseGuards, ForbiddenException } from '@nestjs/common';
import { UsersService } from './users.service';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { UpdateUserDto, UserFilterDto } from './dto/user.dto';
import { Role } from '../../common/enums/role.enum';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async findAll(@Query() query: UserFilterDto) {
    return this.usersService.findAll(query);
  }

  @Get('me')
  async getProfile(@CurrentUser('sub') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get(':id')
  async findOne(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    if (id !== userId) {
      const requester = await this.usersService.findById(userId);
      if (requester.role !== Role.SUPER_ADMIN && requester.role !== Role.ADMIN) {
        throw new ForbiddenException('Insufficient permissions to view other users');
      }
    }
    return this.usersService.findById(id);
  }

  @Patch(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.update(id, dto, userId);
  }

  @Patch(':id/role')
  @UseGuards(RolesGuard, PermissionsGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  @Permissions('users:write:role')
  async updateRole(
    @Param('id') id: string,
    @Body('role') role: Role,
    @CurrentUser('sub') userId: string,
  ) {
    return this.usersService.updateRole(id, role, userId);
  }

  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles('SUPER_ADMIN', 'ADMIN')
  async remove(@Param('id') id: string, @CurrentUser('sub') userId: string) {
    await this.usersService.softDelete(id, userId);
    return { message: 'User deleted successfully' };
  }
}
