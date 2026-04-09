import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe,
} from '@nestjs/common';
import { FactureService } from './facture.service';
import { FactureStatus, ModePaiement } from './enums/facture-status.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('factures')
export class FactureController {
  constructor(private factureService: FactureService) {}

  // ─── CREATION ─────────────────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  create(@Req() req: any, @Body() body: any) {
    return this.factureService.create({ ...body, createdById: req.user.id }, req.user);
  }

  @Post('from-bl/:blId')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  createFromBL(
    @Param('blId', ParseIntPipe) blId: number,
    @Req() req: any,
    @Body() body: {
      montantHT: number;
      tauxTVA?: number;
      dateEcheance?: Date;
      notes?: string;
    },
  ) {
    return this.factureService.createFromBL(blId, {
      ...body,
      createdById: req.user.id,
    });
  }

  // ─── ROUTES STATIQUES AVANT /:id ─────────────────────

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  getStats(@Req() req: any) {
    return this.factureService.getStats(req.user);
  }

  @Get('my-factures')
  @Roles(UserRole.CLIENT)
  getMyFactures(@Req() req: any) {
    return this.factureService.findMyFactures(req.user.id);
  }

  // ─── LISTING ──────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  findAll(
    @Req() req: any,
    @Query('status') status?: FactureStatus,
    @Query('clientId') clientId?: string,
    @Query('companyId') companyId?: string,
    @Query('missionId') missionId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (clientId) filters.clientId = +clientId;
    if (companyId) filters.companyId = +companyId;
    if (missionId) filters.missionId = +missionId;
    return this.factureService.findAll(filters, req.user);
  }

  // ─── ACTIONS SUR UNE FACTURE ──────────────────────────

  @Patch(':id/send')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  send(@Param('id', ParseIntPipe) id: number) {
    return this.factureService.send(id);
  }

  @Patch(':id/paid')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  markAsPaid(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      modePaiement: ModePaiement;
      datePaiement?: Date;
      notes?: string;
    },
  ) {
    return this.factureService.markAsPaid(id, body);
  }

  @Patch(':id/overdue')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  markAsOverdue(@Param('id', ParseIntPipe) id: number) {
    return this.factureService.markAsOverdue(id);
  }

  @Patch(':id/cancel')
  @Roles(UserRole.ADMIN)
  cancel(
    @Param('id', ParseIntPipe) id: number,
    @Body('cancelReason') cancelReason: string,
  ) {
    return this.factureService.cancel(id, cancelReason);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.factureService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.factureService.remove(id);
  }

  // ─── GET /:id EN DERNIER ──────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.ACCOUNTANT, UserRole.CLIENT,
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.factureService.findOne(id);
  }
}