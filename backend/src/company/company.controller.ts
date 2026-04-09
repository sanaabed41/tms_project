import {
  Controller,
  Post, Get, Patch, Delete,
  Param, Body, Query, Req,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import { CompanyService } from './company.service';
import { Roles } from '../common/decorators/roles.decorator';
import { Public } from '../common/decorators/public.decorator';
import { UserRole } from '../users/enums/user-role.enum';

@Controller('companies')
export class CompanyController {
  constructor(private companyService: CompanyService) {}

  // ─── SUPER_ADMIN ONLY — créer une company ─────────────

  @Post()
  @Roles(UserRole.SUPER_ADMIN)
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

  // ─── ADMIN modifie uniquement SA company ─────────────

  @Patch(':id')
  @Roles(UserRole.ADMIN)
  update(@Param('id', ParseIntPipe) id: number, @Body() body: any, @Req() req: any) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId !== id) {
      throw new ForbiddenException('You can only update your own company');
    }
    return this.companyService.update(id, body);
  }

  @Patch(':id/activate')
  @Roles(UserRole.SUPER_ADMIN)
  activate(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.activate(id);
  }

  @Patch(':id/deactivate')
  @Roles(UserRole.SUPER_ADMIN)
  deactivate(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.deactivate(id);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.companyService.remove(id);
  }

  // ─── CONTACTS ─────────────────────────────────────────

  @Post(':id/contacts')
  @Roles(UserRole.ADMIN)
  addContact(
    @Param('id', ParseIntPipe) id: number,
    @Body() body: {
      email: string;
      password: string;
      firstName: string;
      lastName: string;
      phone?: string;
    },
    @Req() req: any,
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId !== id) {
      throw new ForbiddenException('You can only manage contacts of your own company');
    }
    return this.companyService.addContact(id, body);
  }

  @Get(':id/contacts')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER)
  getContacts(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId !== id) {
      throw new ForbiddenException('You can only view contacts of your own company');
    }
    return this.companyService.getContacts(id);
  }

  @Delete(':id/contacts/:contactId')
  @Roles(UserRole.ADMIN)
  removeContact(
    @Param('id', ParseIntPipe) id: number,
    @Param('contactId', ParseIntPipe) contactId: number,
    @Req() req: any,
  ) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId !== id) {
      throw new ForbiddenException('You can only manage contacts of your own company');
    }
    return this.companyService.removeContact(id, contactId);
  }

  // ─── PUBLIC — annuaire des entreprises actives ────────

  @Get('public')
  @Public()
  findPublic(@Query('search') search?: string) {
    return this.companyService.findPublic(search);
  }

  // ─── ROUTES STATIQUES AVANT /:id ─────────────────────

  @Get('stats')
  @Roles(UserRole.ADMIN, UserRole.ACCOUNTANT)
  getStats() {
    return this.companyService.getStats();
  }

  // ─── ADMIN voit uniquement SA company ────────────────

  @Get('my-company')
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  getMyCompany(@Req() req: any) {
    if (!req.user.companyId) {
      throw new ForbiddenException('You are not assigned to a company');
    }
    return this.companyService.findOne(req.user.companyId);
  }

  // ─── SUPER_ADMIN voit toutes les companies ────────────

  @Get()
  @Roles(UserRole.SUPER_ADMIN)
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
  @Roles(UserRole.ADMIN, UserRole.DISPATCHER, UserRole.ACCOUNTANT)
  findOne(@Param('id', ParseIntPipe) id: number, @Req() req: any) {
    if (req.user.role !== 'SUPER_ADMIN' && req.user.companyId !== id) {
      throw new ForbiddenException('You can only view your own company');
    }
    return this.companyService.findOne(id);
  }
}