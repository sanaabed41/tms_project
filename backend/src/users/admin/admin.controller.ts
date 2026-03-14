import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, ParseIntPipe, Query,
} from '@nestjs/common';
import { AdminService } from './admin.service';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../users/enums/user-role.enum';

@Controller('admin')
@Roles(UserRole.ADMIN)
export class AdminController {
  constructor(private adminService: AdminService) {}

  // POST /admin/drivers
  @Post('drivers')
  createDriver(@Body() body: any) {
    return this.adminService.createDriver(body);
  }

  // POST /admin/users
  @Post('users')
  createUser(@Body() body: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }) {
    return this.adminService.createUser(body);
  }

  // GET /admin/users?role=DRIVER&isActive=true
  @Get('users')
  findAllUsers(
    @Query('role') role?: UserRole,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (role) filters.role = role;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    return this.adminService.findAllUsers(filters);
  }

  // GET /admin/users/:id
  @Get('users/:id')
  findOneUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.findOneUser(id);
  }

  // PATCH /admin/users/:id
  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.adminService.updateUser(id, body);
  }

  // PATCH /admin/users/:id/role
  @Patch('users/:id/role')
  changeRole(
    @Param('id', ParseIntPipe) id: number,
    @Body('role') role: UserRole,
  ) {
    return this.adminService.changeRole(id, role);
  }

  // POST /admin/users/:id/reset-password
  @Post('users/:id/reset-password')
  resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword: string,
  ) {
    return this.adminService.resetUserPassword(id, newPassword);
  }

  // PATCH /admin/users/:id/activate
  @Patch('users/:id/activate')
  activateUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.activateUser(id);
  }

  // PATCH /admin/users/:id/deactivate
  @Patch('users/:id/deactivate')
  deactivateUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deactivateUser(id);
  }

  // DELETE /admin/users/:id
  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.adminService.deleteUser(id);
  }
}