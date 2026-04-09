import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe,
} from '@nestjs/common';
import { MissionService } from './mission.service';
import { MissionStatus } from './enums/mission-status.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('missions')
export class MissionController {
  constructor(private missionService: MissionService) {}

  // ─── ADMIN + MANAGER + DISPATCHER ────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  create(@Req() req: any, @Body() body: {
    origine: string;
    destination: string;
    dateDepart: Date;
    dateArriveePrevu: Date;
    description?: string;
    distanceKm?: number;
    poids?: number;
    clientId?: number;
    camionId?: number;
    driverId?: number;
    companyId?: number;
  }) {
    return this.missionService.create({
      ...body,
      createdById: req.user.id,
    }, req.user);
  }

  @Patch(':id/assign')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  assign(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: { camionId: number; driverId: number },
  ) {
    return this.missionService.assign(id, body.camionId, body.driverId);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: any,
  ) {
    return this.missionService.update(id, body);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.missionService.remove(id);
  }

  // ─── ROUTES STATIQUES AVANT /:id ─────────────────────

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  getStats(@Req() req: any) {
    return this.missionService.getStats(req.user);
  }

  @Get('my-missions')
  @Roles(UserRole.DRIVER)
  getMyMissions(@Req() req: any) {
    return this.missionService.findMyMissions(req.user.id);
  }

  @Get('my-orders')
  @Roles(UserRole.CLIENT)
  getMyOrders(@Req() req: any) {
    return this.missionService.findMyOrders(req.user.id);
  }

  // ─── ADMIN + MANAGER + DISPATCHER + ACCOUNTANT ───────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findAll(
    @Req() req: any,
    @Query('status') status?: MissionStatus,
    @Query('driverId') driverId?: string,
    @Query('clientId') clientId?: string,
    @Query('camionId') camionId?: string,
    @Query('companyId') companyId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (driverId) filters.driverId = +driverId;
    if (clientId) filters.clientId = +clientId;
    if (camionId) filters.camionId = +camionId;
    if (companyId) filters.companyId = +companyId;
    return this.missionService.findAll(filters, req.user);
  }

  // ─── CHANGER STATUT ───────────────────────────────────

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.DRIVER)
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      status: MissionStatus;
      notes?: string;
      cancelReason?: string;
      dateArriveeReelle?: Date;
    },
  ) {
    return this.missionService.changeStatus(id, body.status, body);
  }

  // ─── GET /:id — EN DERNIER ────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.DISPATCHER, UserRole.ACCOUNTANT,
    UserRole.DRIVER, UserRole.CLIENT,
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.missionService.findOne(id);
  }
}