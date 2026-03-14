import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsersService } from '../../users/users.service';
import { UserRole } from '../../users/enums/user-role.enum';
import { User } from '../../users/user.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AdminService {
  constructor(
    private usersService: UsersService,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ✅ Créer un driver
  async createDriver(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const driver = await this.usersService.create({
      ...data,
      password: hashedPassword,
      role: UserRole.DRIVER,
    });

    return {
      message: 'Driver created successfully',
      user: this.sanitize(driver),
    };
  }

  // ✅ Créer n'importe quel type de user
  async createUser(data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: UserRole;
  }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    return {
      message: `${data.role} created successfully`,
      user: this.sanitize(user),
    };
  }

  // ✅ Voir tous les users avec filtres optionnels
  async findAllUsers(filters?: { role?: UserRole; isActive?: boolean }) {
    const query = this.userRepository.createQueryBuilder('user');

    if (filters?.role) {
      query.andWhere('user.role = :role', { role: filters.role });
    }

    if (filters?.isActive !== undefined) {
      query.andWhere('user.isActive = :isActive', { isActive: filters.isActive });
    }

    query.orderBy('user.createdAt', 'DESC');

    const users = await query.getMany();
    return {
      total: users.length,
      users: users.map((u) => this.sanitize(u)),
    };
  }

  // ✅ Voir un user
  async findOneUser(id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    return this.sanitize(user, true);
  }

  // ✅ Modifier un user
  async updateUser(id: number, data: any) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const allowedFields = ['firstName', 'lastName', 'phone', 'profilePicture', 'role', 'isActive', 'password'];
    const sanitized: Partial<User> = {};
    for (const key of allowedFields) {
      if (data[key] !== undefined) sanitized[key] = data[key];
    }

    if (sanitized.password) {
      sanitized.password = await bcrypt.hash(sanitized.password as string, 10);
    }

    const updated = await this.usersService.update(id, sanitized);
    return {
      message: 'User updated successfully',
      user: this.sanitize(updated, true),
    };
  }

  // ✅ Changer uniquement le rôle
  async changeRole(id: number, role: UserRole) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    if (user.role === role) {
      return { message: `User #${id} already has role ${role}` };
    }

    const updated = await this.usersService.update(id, { role });
    return {
      message: `Role updated to ${role} successfully`,
      user: this.sanitize(updated, true),
    };
  }

  // ✅ Reset password d'un user par admin (sans token)
  async resetUserPassword(id: number, newPassword: string) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await this.usersService.update(id, { password: hashedPassword });

    return { message: `Password reset successfully for user #${id}` };
  }

  // ✅ Activer un user
  async activateUser(id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    if (user.isActive) return { message: `User #${id} is already active` };

    const updated = await this.usersService.update(id, { isActive: true });
    return {
      message: `User #${id} activated successfully`,
      user: this.sanitize(updated, true),
    };
  }

  // ✅ Désactiver un user
  async deactivateUser(id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    if (!user.isActive) return { message: `User #${id} is already inactive` };

    const updated = await this.usersService.update(id, { isActive: false });
    return {
      message: `User #${id} deactivated successfully`,
      user: this.sanitize(updated, true),
    };
  }

  // ✅ Supprimer un user
  async deleteUser(id: number) {
    const user = await this.usersService.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`);
    await this.usersService.remove(id);
    return { message: `User #${id} deleted successfully` };
  }

  // 🔒 Helper
  private sanitize(user: User, withDates = false) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      createdAt: user.createdAt,
      ...(withDates && { updatedAt: user.updatedAt }),
    };
  }
}