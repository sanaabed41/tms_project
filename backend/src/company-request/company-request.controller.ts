import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CompanyRequestService } from './company-request.service';
import { RequestStatus } from './enums/request-status.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';
import { Public } from '../common/decorators/public.decorator';

@Controller('company-requests')
export class CompanyRequestController {
  constructor(private svc: CompanyRequestService) {}

  // ── PUBLIC — Soumettre une demande d'inscription entreprise ───────────────

  @Post()
  @Public()
  submit(@Body() body: {
    companyNom: string;
    companyAdresse: string;
    companyVille: string;
    companyPays?: string;
    companyEmail: string;
    companyTelephone: string;
    companySiteWeb?: string;
    companyRC?: string;
    companyTVA?: string;
    companyDescription?: string;
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPhone?: string;
  }) {
    return this.svc.submit(body);
  }

  // ── SUPER_ADMIN — Gestion des demandes ───────────────────────────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
  findAll(
    @Query('status') status?: RequestStatus,
    @Query('search') search?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (search) filters.search = search;
    return this.svc.findAll(filters);
  }

  @Get('stats')
  @Roles(UserRole.SUPER_ADMIN)
  getStats() {
    return this.svc.getStats();
  }

  @Get(':id')
  @Roles(UserRole.SUPER_ADMIN)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.svc.findOne(id);
  }

  @Patch(':id/approve')
  @Roles(UserRole.SUPER_ADMIN)
  approve(@Param('id', ParseIntPipe) id: number) {
    return this.svc.approve(id);
  }

  @Patch(':id/reject')
  @Roles(UserRole.SUPER_ADMIN)
  reject(
    @Param('id', ParseIntPipe) id: number,
    @Body('rejectReason') rejectReason: string,
  ) {
    return this.svc.reject(id, rejectReason);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.svc.remove(id);
  }
}
