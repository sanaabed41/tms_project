import {
  Controller, Get, Post, Patch, Delete,
  Param, Body, Query, ParseIntPipe,
} from '@nestjs/common';
import { SuperAdminService } from './super-admin.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('super-admin')
@Roles(UserRole.SUPER_ADMIN)
export class SuperAdminController {
  constructor(private svc: SuperAdminService) {}

  // ── Stats ─────────────────────────────────────────────────────────────────

  @Get('stats')
  getStats() { return this.svc.getStats(); }

  // ── Companies ─────────────────────────────────────────────────────────────

  @Get('companies')
  findAllCompanies(
    @Query('isActive') isActive?: string,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (search) filters.search = search;
    return this.svc.findAllCompanies(filters);
  }

  @Get('companies/:id')
  findOneCompany(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneCompany(id);
  }

  @Post('companies')
  createCompany(@Body() body: any) {
    return this.svc.createCompany(body);
  }

  @Patch('companies/:id')
  updateCompany(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updateCompany(id, body);
  }

  @Patch('companies/:id/toggle')
  toggleCompany(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggleCompany(id);
  }

  @Delete('companies/:id')
  deleteCompany(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteCompany(id);
  }

  @Post('companies/:id/admin')
  createAdminForCompany(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.createAdminForCompany(id, body);
  }

  // ── Users (platform-wide) ─────────────────────────────────────────────────

  @Get('users')
  findAllUsers(
    @Query('role') role?: UserRole,
    @Query('companyId') companyId?: string,
    @Query('search') search?: string,
    @Query('isActive') isActive?: string,
  ) {
    const filters: any = {};
    if (role) filters.role = role;
    if (companyId) filters.companyId = +companyId;
    if (search) filters.search = search;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    return this.svc.findAllUsers(filters);
  }

  @Get('users/:id')
  findOneUser(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOneUser(id);
  }

  @Patch('users/:id/toggle')
  toggleUser(@Param('id', ParseIntPipe) id: number) {
    return this.svc.toggleUser(id);
  }

  @Patch('users/:id')
  updateUser(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.svc.updateUser(id, body);
  }

  @Delete('users/:id')
  deleteUser(@Param('id', ParseIntPipe) id: number) {
    return this.svc.deleteUser(id);
  }

  @Post('users/:id/reset-password')
  resetUserPassword(
    @Param('id', ParseIntPipe) id: number,
    @Body('newPassword') newPassword: string,
  ) {
    return this.svc.resetUserPassword(id, newPassword);
  }
}
