import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from '../company/company.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SuperAdminService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ── Platform stats ────────────────────────────────────────────────────────

  async getStats() {
    const [totalCompanies, activeCompanies, totalUsers, activeUsers] = await Promise.all([
      this.companyRepository.count(),
      this.companyRepository.count({ where: { isActive: true } }),
      this.userRepository.count(),
      this.userRepository.count({ where: { isActive: true } }),
    ]);

    const usersByRole = await this.userRepository
      .createQueryBuilder('user')
      .select('user.role', 'role')
      .addSelect('COUNT(*)', 'count')
      .groupBy('user.role')
      .getRawMany();

    // Recent 5 companies
    const recentCompanies = await this.companyRepository.find({
      order: { createdAt: 'DESC' },
      take: 5,
    });

    // Recent 5 users (non-super-admin)
    const recentUsers = await this.userRepository.find({
      where: { role: UserRole.ADMIN },
      order: { createdAt: 'DESC' },
      take: 5,
    });

    return {
      totalCompanies,
      activeCompanies,
      inactiveCompanies: totalCompanies - activeCompanies,
      totalUsers,
      activeUsers,
      inactiveUsers: totalUsers - activeUsers,
      usersByRole: usersByRole.reduce((acc, r) => ({ ...acc, [r.role]: +r.count }), {}),
      recentCompanies: recentCompanies.map((c) => this.sanitizeCompany(c, true)),
      recentAdmins: recentUsers.map((u) => ({
        id: u.id, email: u.email, firstName: u.firstName,
        lastName: u.lastName, companyId: u.companyId, createdAt: u.createdAt,
      })),
    };
  }

  // ── Companies ─────────────────────────────────────────────────────────────

  async findAllCompanies(filters?: { isActive?: boolean; search?: string }) {
    const query = this.companyRepository.createQueryBuilder('company');

    if (filters?.isActive !== undefined) {
      query.andWhere('company.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters?.search) {
      query.andWhere(
        '(company.nom ILIKE :s OR company.email ILIKE :s OR company.ville ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    query.orderBy('company.createdAt', 'DESC');
    const companies = await query.getMany();

    const enriched = await Promise.all(
      companies.map(async (c) => {
        const [userCount, adminCount] = await Promise.all([
          this.userRepository.count({ where: { companyId: c.id } }),
          this.userRepository.count({ where: { companyId: c.id, role: UserRole.ADMIN } }),
        ]);
        return { ...this.sanitizeCompany(c, true), userCount, adminCount };
      }),
    );

    return { total: enriched.length, companies: enriched };
  }

  async findOneCompany(id: number) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);

    const users = await this.userRepository.find({
      where: { companyId: id },
      order: { createdAt: 'DESC' },
    });

    const usersByRole = users.reduce((acc, u) => {
      acc[u.role] = (acc[u.role] ?? 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    return {
      ...this.sanitizeCompany(company, true),
      userCount: users.length,
      usersByRole,
      users: users.map((u) => this.sanitizeUser(u)),
    };
  }

  async createCompany(data: {
    nom: string; adresse: string; ville: string; pays?: string;
    email: string; telephone: string; siteWeb?: string; RC?: string; TVA?: string;
  }) {
    const existing = await this.companyRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Un compte avec cet email existe déjà');

    const company = this.companyRepository.create(data);
    const saved = await this.companyRepository.save(company);
    return { message: 'Entreprise créée', company: this.sanitizeCompany(saved, true) };
  }

  async updateCompany(id: number, data: Partial<Company>) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    Object.assign(company, data);
    const saved = await this.companyRepository.save(company);
    return { message: 'Entreprise mise à jour', company: this.sanitizeCompany(saved, true) };
  }

  async toggleCompany(id: number) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    company.isActive = !company.isActive;
    await this.companyRepository.save(company);

    // Also deactivate/reactivate all company users
    await this.userRepository
      .createQueryBuilder()
      .update(User)
      .set({ isActive: company.isActive })
      .where('companyId = :id', { id })
      .execute();

    return {
      message: `Entreprise ${company.isActive ? 'activée' : 'désactivée'} — utilisateurs mis à jour`,
      isActive: company.isActive,
    };
  }

  async deleteCompany(id: number) {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);

    const userCount = await this.userRepository.count({ where: { companyId: id } });
    if (userCount > 0) {
      throw new ConflictException(
        `Impossible de supprimer : ${userCount} utilisateur(s) liés à cette entreprise. Supprimez-les d'abord.`,
      );
    }

    await this.companyRepository.delete(id);
    return { message: `Entreprise "${company.nom}" supprimée` };
  }

  // ── Admin creation for a company ──────────────────────────────────────────

  async createAdminForCompany(companyId: number, data: {
    email: string; password: string; firstName: string; lastName: string; phone?: string;
  }) {
    const company = await this.companyRepository.findOne({ where: { id: companyId } });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);

    const existing = await this.userRepository.findOne({ where: { email: data.email } });
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashed = await bcrypt.hash(data.password, 10);
    const admin = this.userRepository.create({
      ...data,
      password: hashed,
      role: UserRole.ADMIN,
      companyId,
      isEmailVerified: true,
      isActive: true,
    });

    const saved = await this.userRepository.save(admin);
    return {
      message: `Admin créé pour ${company.nom}`,
      user: this.sanitizeUser(saved),
    };
  }

  // ── User management (platform-wide) ──────────────────────────────────────

  async findAllUsers(filters?: { role?: UserRole; companyId?: number; search?: string; isActive?: boolean }) {
    const query = this.userRepository
      .createQueryBuilder('user')
      .leftJoinAndSelect('user.company', 'company')
      .where('user.role != :sr', { sr: UserRole.SUPER_ADMIN });

    if (filters?.role) query.andWhere('user.role = :role', { role: filters.role });
    if (filters?.companyId) query.andWhere('user.companyId = :cid', { cid: filters.companyId });
    if (filters?.isActive !== undefined) query.andWhere('user.isActive = :ia', { ia: filters.isActive });
    if (filters?.search) {
      query.andWhere(
        '(user.email ILIKE :s OR user.firstName ILIKE :s OR user.lastName ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    query.orderBy('user.createdAt', 'DESC');
    const users = await query.getMany();

    return {
      total: users.length,
      users: users.map((u) => ({
        ...this.sanitizeUser(u),
        companyName: (u as any).company?.nom ?? null,
      })),
    };
  }

  async findOneUser(id: number) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['company'],
    });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return {
      ...this.sanitizeUser(user, true),
      companyName: (user as any).company?.nom ?? null,
    };
  }

  async toggleUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    if (user.role === UserRole.SUPER_ADMIN) throw new ConflictException('Cannot deactivate SUPER_ADMIN');

    user.isActive = !user.isActive;
    await this.userRepository.save(user);
    return {
      message: `Utilisateur ${user.isActive ? 'activé' : 'désactivé'}`,
      isActive: user.isActive,
    };
  }

  async updateUser(id: number, data: { role?: UserRole; isActive?: boolean; firstName?: string; lastName?: string; phone?: string }) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    if (user.role === UserRole.SUPER_ADMIN) throw new ConflictException('Cannot modify SUPER_ADMIN');

    Object.assign(user, data);
    const saved = await this.userRepository.save(user);
    return { message: 'Utilisateur mis à jour', user: this.sanitizeUser(saved) };
  }

  async deleteUser(id: number) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);
    if (user.role === UserRole.SUPER_ADMIN) throw new ConflictException('Cannot delete SUPER_ADMIN');

    await this.userRepository.delete(id);
    return { message: `Utilisateur "${user.email}" supprimé` };
  }

  async resetUserPassword(id: number, newPassword: string) {
    const user = await this.userRepository.findOne({ where: { id } });
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const hashed = await bcrypt.hash(newPassword, 10);
    await this.userRepository.update(id, { password: hashed });
    return { message: 'Mot de passe réinitialisé' };
  }

  // ── Helpers ───────────────────────────────────────────────────────────────

  private sanitizeCompany(c: Company, withDates = false) {
    return {
      id: c.id, nom: c.nom, adresse: c.adresse, ville: c.ville, pays: c.pays,
      email: c.email, telephone: c.telephone, siteWeb: c.siteWeb,
      RC: c.RC, TVA: c.TVA, logo: c.logo, isActive: c.isActive,
      ...(withDates && { createdAt: c.createdAt, updatedAt: c.updatedAt }),
    };
  }

  private sanitizeUser(u: User, withDates = false) {
    return {
      id: u.id, email: u.email, firstName: u.firstName, lastName: u.lastName,
      phone: u.phone, role: u.role, isActive: u.isActive, companyId: u.companyId,
      ...(withDates && { createdAt: u.createdAt, updatedAt: u.updatedAt }),
    };
  }
}
