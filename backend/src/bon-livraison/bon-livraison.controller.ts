import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe,
} from '@nestjs/common';
import { BonLivraisonService } from './bon-livraison.service';
import { BonLivraisonStatus } from './enums/bon-livraison-status.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('bons-livraison')
export class BonLivraisonController {
  constructor(private blService: BonLivraisonService) {}

  // ─── CREATION ─────────────────────────────────────────

  // Création manuelle
  @Post()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  create(@Req() req: any, @Body() body: any) {
    return this.blService.create({ ...body, createdById: req.user.id });
  }

  // Création automatique depuis mission
  @Post('from-mission/:missionId')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  createFromMission(
    @Param('missionId', ParseIntPipe) missionId: number,
    @Req() req: any,
  ) {
    return this.blService.createFromMission(missionId, req.user.id);
  }

  // ─── ROUTES STATIQUES AVANT /:id ─────────────────────

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  getStats() {
    return this.blService.getStats();
  }

  @Get('my-bls')
  @Roles(UserRole.DRIVER)
  getMyBLs(@Req() req: any) {
    return this.blService.findMyBLs(req.user.id);
  }

  @Get('my-deliveries')
  @Roles(UserRole.CLIENT)
  getMyDeliveries(@Req() req: any) {
    return this.blService.findMyClientBLs(req.user.id);
  }

  // ─── LISTING ──────────────────────────────────────────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findAll(
    @Req() req: any,
    @Query('status') status?: BonLivraisonStatus,
    @Query('clientId') clientId?: string,
    @Query('companyId') companyId?: string,
    @Query('driverId') driverId?: string,
    @Query('missionId') missionId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (clientId) filters.clientId = +clientId;
    if (driverId) filters.driverId = +driverId;
    if (missionId) filters.missionId = +missionId;
    // Auto-scope by company unless SUPER_ADMIN
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId) {
      filters.companyId = req.user.companyId;
    } else if (companyId) {
      filters.companyId = +companyId;
    }
    return this.blService.findAll(filters);
  }

  // ─── ACTIONS SUR UN BL ────────────────────────────────

  @Patch(':id/confirm')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  confirm(@Param('id', ParseIntPipe) id: number) {
    return this.blService.confirm(id);
  }

  @Patch(':id/sign-driver')
  @Roles(UserRole.DRIVER)
  signByDriver(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('signature') signature: string,
  ) {
    return this.blService.signByDriver(id, req.user.id, signature);
  }

  @Patch(':id/sign-client')
  @Roles(UserRole.CLIENT)
  signByClient(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: any,
    @Body('signature') signature: string,
  ) {
    return this.blService.signByClient(id, req.user.id, signature);
  }

  @Patch(':id/photo')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  uploadPhoto(
    @Param('id', ParseIntPipe) id: number,
    @Body('photoUrl') photoUrl: string,
  ) {
    return this.blService.uploadPhoto(id, photoUrl);
  }

  @Patch(':id/archive')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  archive(@Param('id', ParseIntPipe) id: number) {
    return this.blService.archive(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.blService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.blService.remove(id);
  }

  // ─── GET /:id EN DERNIER ──────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.DISPATCHER, UserRole.ACCOUNTANT,
    UserRole.DRIVER, UserRole.CLIENT,
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.blService.findOne(id);
  }
}