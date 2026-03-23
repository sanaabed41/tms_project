import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query,
  ParseIntPipe,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // ─── ADMIN + MANAGER ONLY ─────────────────────────────

  @Post()
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  create(@Body() body: {
    nom: string;
    adresse: string;
    ville: string;
    pays?: string;
    email: string;
    telephone: string;
    siteWeb?: string;
    RC?: string;
    TVA?: string;
    logo?: string;
  }) {
    return this.companyService.create(body);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any) {
    return this.companyService.update(id, body);
  }

  @Patch(':id/activate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.deactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.remove(id);
  }

  // ─── CONTACTS ─────────────────────────────────────────

  @Post(':id/contacts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  addContact(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
  ) {
    return this.companyService.addContact(id, body);
  }

  @Get(':id/contacts')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER)
  getContacts(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.getContacts(id);
  }

  @Delete(':id/contacts/:contactId')
  @Roles(UserRole.ADMIN, UserRole.MANAGER)
  removeContact(
    @Param('id', ParseIntPipe) id: number,
    @Param('contactId', ParseIntPipe) contactId: number,
  ) {
    return this.companyService.removeContact(id, contactId);
  }

  // ─── ROUTES STATIQUES AVANT /:id ─────────────────────

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.ACCOUNTANT)
  getStats() {
    return this.companyService.getStats();
  }

  // ─── ALL ROLES (sauf CLIENT) ──────────────────────────

  @Get()
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findAll(
    @Query('isActive') isActive?: string,
    @Query('ville') ville?: string,
  ) {
    const filters: any = {};
    if (isActive !== undefined) filters.isActive = isActive === 'true';
    if (ville) filters.ville = ville;
    return this.companyService.findAll(filters);
  }

  @Get(':id')
  @Roles(UserRole.ADMIN, UserRole.MANAGER, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.findOne(id);
  }
}