import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import * as bcrypt from 'bcrypt';
import { User } from './user.entity';
import { UpdateUserDto } from './dto/update-user.dto';
import { UpdateRoleDto } from './dto/update-role.dto';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // 🔹 Récupérer tous les utilisateurs
  findAll(): Promise<User[]> {
    return this.userRepository.find({ order: { createdAt: 'DESC' } });
  }

  // 🔹 Récupérer un utilisateur par ID
  async findOne(id: number): Promise<User | null> {
    console.log('🔍 findOne called with id:', id, typeof id);
    const user = await this.userRepository.findOne({ where: { id } });
    console.log('🔍 findOne result:', user);
    return user;
  }

  // 🔹 Créer un utilisateur
  async create(data: Partial<User>): Promise<User> {
    try {
      console.log('CREATE USER DATA:', data);

      if (!data.email || !data.password) {
        throw new BadRequestException('Email and password are required');
      }

      const user = this.userRepository.create({
        ...data,
        firstName: data.firstName ?? '',
        lastName: data.lastName ?? '',
        isActive: data.isActive ?? true,
      });

      const savedUser = await this.userRepository.save(user);
      console.log('USER SAVED:', savedUser);
      return savedUser;

    } catch (error) {
      console.error('ERROR IN CREATE USER:', error);
      throw error;
    }
  }

  // 🔹 Mettre à jour le rôle uniquement
  async updateRole(id: number, dto: UpdateRoleDto): Promise<User> {
    await this.userRepository.update(id, { role: dto.role });
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException(`User #${id} not found`); // ✅ fix null
    return updated;
  }

  // 🔹 Mettre à jour n'importe quel champ
    async update(id: number, data: any) {
    const user = await this.userRepository.findOneBy({ id });
    if (!user) {
      throw new Error('User not found');
    }
    Object.assign(user, data);
    return this.userRepository.save(user);
  }

  // 🔹 Supprimer un utilisateur
  async remove(id: number): Promise<void> {
    await this.userRepository.delete(id); // ✅ delete(id) au lieu de remove(user) → pas de null issue
  }

  // 🔹 Activer un utilisateur
  async activate(id: number): Promise<User> {
    await this.userRepository.update(id, { isActive: true });
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException(`User #${id} not found`);
    return updated;
  }

  // 🔹 Désactiver un utilisateur
  async deactivate(id: number): Promise<User> {
    await this.userRepository.update(id, { isActive: false });
    const updated = await this.findOne(id);
    if (!updated) throw new NotFoundException(`User #${id} not found`);
    return updated;
  }

  // 🔹 Trouver par email
  async findByEmail(email: string): Promise<User | null> {
    return this.userRepository.findOne({ where: { email } });
  }

  // 🔹 Changer le mot de passe
  async changePassword(id: number, newPassword: string): Promise<User> {
    const user = await this.findOne(id);
    if (!user) throw new NotFoundException(`User #${id} not found`); // ✅ fix null
    user.password = await bcrypt.hash(newPassword, 10);
    return this.userRepository.save(user);
  }
// 🔹 Voir son propre profil
  async getProfile(id: number): Promise<Partial<User>> {
  const user = await this.findOne(id);
  if (!user) throw new NotFoundException(`User #${id} not found`);
  return this.sanitize(user);
}
// 🔹 Mettre à jour son propre profil
async updateProfile(id: number, data: {
  firstName?: string;
  lastName?: string;
  phone?: string;
  profilePicture?: string;
}): Promise<{ message: string; user: Partial<User> }> {
  const user = await this.findOne(id);
  if (!user) throw new NotFoundException(`User #${id} not found`);

  const allowedFields = ['firstName', 'lastName', 'phone', 'profilePicture'];
  const sanitized: Partial<User> = {};
  for (const key of allowedFields) {
    if (data[key] !== undefined) sanitized[key] = data[key];
  }

  const updated = await this.update(id, sanitized);
  return {
    message: 'Profile updated successfully',
    user: this.sanitize(updated),
  };
}

// 🔒 Helper — retire les champs sensibles
sanitize(user: User): Partial<User> {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    profilePicture: user.profilePicture,
    role: user.role,
    isActive: user.isActive,
    createdAt: user.createdAt,
  };
}}