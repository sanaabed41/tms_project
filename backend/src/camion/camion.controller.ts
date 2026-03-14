import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe,
} from '@nestjs/common';
import { CamionService } from './camion.service';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';
import { CamionStatus } from './enums/camion-status.enum';
import { CamionType } from './enums/camion-type.enum';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('camions')
export class CamionController {
  constructor(private camionService: CamionService) {}

  // ─── ADMIN + MANAGER ONLY ─────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() dto: CreateCamionDto) {
    return this.camionService.create(dto);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.camionService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.camionService.deactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.camionService.remove(id);
  }

  // ─── ADMIN + MANAGER + DISPATCHER ────────────────────

  @Patch(':id/status')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)
  changeStatus(
    @Param('id', ParseIntPipe) id: number,
    @Body('status') status: CamionStatus,
  ) {
    return this.camionService.changeStatus(id, status);
  }

  @Patch(':id/assign-driver')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)
  assignDriver(
    @Param('id', ParseIntPipe) id: number,
    @Body('driverId') driverId: number,
  ) {
    return this.camionService.assignDriver(id, driverId);
  }

  @Patch(':id/unassign-driver')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)
  unassignDriver(@Param('id', ParseIntPipe) id: number) {
    return this.camionService.unassignDriver(id);
  }

  // ─── ROUTES STATIQUES — AVANT /:id ───────────────────

  @Get('available')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)
  findAvailable() {
    return this.camionService.findAvailable();
  }

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  getStats() {
    return this.camionService.getStats();
  }

  @Get('my-camion')
  @Roles(UserRole.DRIVER)
  getMyCamion(@Req() req: any) {
    return this.camionService.findByDriver(req.user.id);
  }

  @Get('matricule/:matricule')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findByMatricule(@Param('matricule') matricule: string) {
    return this.camionService.findByMatricule(matricule);
  }

  // ─── ADMIN + MANAGER + DISPATCHER + ACCOUNTANT ───────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findAll(
    @Query('status') status?: CamionStatus,
    @Query('type') type?: CamionType,
    @Query('isActive') isActive?: string,
    @Query('driverId') driverId?: string,
  ) {
    const filters: any = {};
    if (status) filters.status = status;
    if (type) filters.type = type;
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (driverId) filters.driverId = +driverId;
    return this.camionService.findAll(filters);
  }

  // ─── PATCH GENERAL — ADMIN + MANAGER ─────────────────

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateCamionDto,
  ) {
    return this.camionService.update(id, dto);
  }

  // ─── GET /:id — EN DERNIER ────────────────────────────

  @Get(':id')
  @Roles(
    UserRole.ADMIN,
    UserRole.MANAGER,
    UserRole.DISPATCHER,
    UserRole.ACCOUNTANT,
    UserRole.DRIVER,
  )
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.camionService.findOne(id);
  }
}
