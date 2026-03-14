import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
  ) {}

  // ✅ Register
  async register(data: {
    email: string;
    password: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
  }) {
    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
    });

    return {
      message: 'User created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // ✅ Login
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Invalid credentials');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Invalid credentials');

    if (!user.isActive) throw new UnauthorizedException('Account is disabled');

    const payload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
      },
    };
  }

  // ✅ Logout (stateless JWT — côté client on supprime le token)
  async logout(userId: number) {
    return { message: `User ${userId} logged out successfully` };
  }

  // ✅ Get Profile
  async getProfile(userId: number) {
    return this.usersService.getProfile(userId);
  }

  // ✅ Update Profile (infos de base seulement)
  async updateProfile(userId: number, data: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    profilePicture?: string;
  }) {
    return this.usersService.updateProfile(userId, data);
  }

  // ✅ Change Password (user connecté)
  async changePassword(userId: number, currentPassword: string, newPassword: string) {
    const user = await this.usersService.findOne(userId);
    if (!user) throw new NotFoundException('User not found');

    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) throw new UnauthorizedException('Current password is incorrect');

    return this.usersService.changePassword(userId, newPassword);
  }

  // ✅ Forgot Password — génère un reset token
  async forgotPassword(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('User not found');

    const resetToken = this.jwtService.sign(
      { sub: user.id, type: 'reset' },
      { expiresIn: '15m' },
    );

    // TODO: envoyer par email (nodemailer / SendGrid)
    return {
      message: 'Reset token generated. Check your email.',
      resetToken, // à retirer en production
    };
  }

  // ✅ Reset Password — avec le token reçu par email
  async resetPassword(token: string, newPassword: string) {
    try {
      const payload = this.jwtService.verify(token);
      if (payload.type !== 'reset') {
        throw new UnauthorizedException('Invalid token type');
      }
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await this.usersService.update(+payload.sub, { password: hashedPassword });
      return { message: 'Password reset successfully' };
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}