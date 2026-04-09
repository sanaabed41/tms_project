import {
  Injectable,
  UnauthorizedException,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OAuth2Client } from 'google-auth-library';
import * as bcrypt from 'bcrypt';
import { MailService } from '../mail/mail.service';
import { UserRole } from '../users/enums/user-role.enum';
import { Company } from '../company/company.entity';

@Injectable()
export class AuthService {
  private googleClient: OAuth2Client;

  constructor(
    private usersService: UsersService,
    private jwtService: JwtService,
    private mailService: MailService,
    private config: ConfigService,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
  ) {
    this.googleClient = new OAuth2Client(this.config.get('GOOGLE_CLIENT_ID'));
  }

  private generateOtp(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  private issueToken(userId: number, role: string) {
    return this.jwtService.sign({ sub: userId, role });
  }

  // ✅ Register — envoie un OTP, compte non activé
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
    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000); // 10 min

    const user = await this.usersService.create({
      ...data,
      password: hashedPassword,
      isEmailVerified: false,
      emailVerificationCode: otp,
      emailVerificationExpiry: expiry,
    });

    await this.mailService.sendOtpVerification(user.email, user.firstName || user.email, otp);

    return {
      message: 'Compte créé. Vérifiez votre email pour activer votre compte.',
      requiresVerification: true,
      email: user.email,
    };
  }

  // ✅ Login — bloque si email non vérifié
  async login(email: string, password: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new UnauthorizedException('Identifiants invalides');

    if (!user.password) throw new UnauthorizedException('Connectez-vous avec Google');

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new UnauthorizedException('Identifiants invalides');

    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    if (!user.isEmailVerified) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    return {
      access_token: this.issueToken(user.id, user.role),
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, companyId: user.companyId ?? null },
    };
  }

  // ✅ Vérifier OTP
  async verifyEmail(email: string, code: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (user.isEmailVerified) throw new BadRequestException('Email déjà vérifié');

    if (!user.emailVerificationCode || user.emailVerificationCode !== code) {
      throw new BadRequestException('Code incorrect');
    }

    if (!user.emailVerificationExpiry || new Date() > user.emailVerificationExpiry) {
      throw new BadRequestException('Code expiré');
    }

    await this.usersService.update(user.id, {
      isEmailVerified: true,
      emailVerificationCode: null,
      emailVerificationExpiry: null,
    });

    return {
      access_token: this.issueToken(user.id, user.role),
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, companyId: user.companyId ?? null },
    };
  }

  // ✅ Renvoyer OTP
  async resendOtp(email: string) {
    const user = await this.usersService.findByEmail(email);
    if (!user) throw new NotFoundException('Utilisateur introuvable');

    if (user.isEmailVerified) throw new BadRequestException('Email déjà vérifié');

    const otp = this.generateOtp();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    await this.usersService.update(user.id, {
      emailVerificationCode: otp,
      emailVerificationExpiry: expiry,
    });

    await this.mailService.sendOtpVerification(user.email, user.firstName || user.email, otp);

    return { message: 'Nouveau code envoyé.' };
  }

  // ✅ Google OAuth — vérifie le token Google et crée/trouve l'utilisateur
  async googleLogin(idToken: string) {
    let ticket: any;
    try {
      ticket = await this.googleClient.verifyIdToken({
        idToken,
        audience: this.config.get('GOOGLE_CLIENT_ID'),
      });
    } catch {
      throw new UnauthorizedException('Token Google invalide');
    }

    const payload = ticket.getPayload();
    const { email, given_name, family_name, sub: googleId } = payload;

    let user = await this.usersService.findByEmail(email);

    if (!user) {
      user = await this.usersService.create({
        email,
        password: '',
        firstName: given_name || '',
        lastName: family_name || '',
        googleId,
        isEmailVerified: true,
        role: UserRole.CLIENT,
      });
    } else if (!user.googleId) {
      await this.usersService.update(user.id, { googleId, isEmailVerified: true });
    }

    if (!user.isActive) throw new UnauthorizedException('Compte désactivé');

    return {
      access_token: this.issueToken(user.id, user.role),
      user: { id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, companyId: user.companyId ?? null },
    };
  }

  // ✅ Register via invitation (email + rôle depuis le token)
  async registerWithInvite(data: {
    inviteToken: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    let payload: any;
    try {
      payload = this.jwtService.verify(data.inviteToken);
    } catch {
      throw new UnauthorizedException('Lien d\'invitation invalide ou expiré');
    }

    if (payload.type !== 'invite') {
      throw new UnauthorizedException('Token invalide');
    }

    const existing = await this.usersService.findByEmail(payload.email);
    if (existing) throw new ConflictException('Ce compte existe déjà');

    const hashedPassword = await bcrypt.hash(data.password, 10);

    const user = await this.usersService.create({
      email: payload.email,
      password: hashedPassword,
      role: payload.role,
      companyId: payload.companyId ?? null,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      isEmailVerified: true,
    });

    const jwtPayload = { sub: user.id, role: user.role };
    return {
      access_token: this.jwtService.sign(jwtPayload),
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        companyId: user.companyId ?? null,
      },
    };
  }

  // ✅ Auto-inscription client via code entreprise
  async registerAsClient(data: {
    companyCode: string;
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }) {
    // Trouver l'entreprise par son code
    const company = await this.companyRepository.findOne({
      where: { companyCode: data.companyCode, isActive: true },
    });
    if (!company) {
      throw new NotFoundException('Code entreprise invalide ou entreprise inactive');
    }

    const existing = await this.usersService.findByEmail(data.email);
    if (existing) throw new ConflictException('Cet email est déjà utilisé');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiry = new Date(Date.now() + 10 * 60 * 1000);

    const user = await this.usersService.create({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      phone: data.phone,
      role: UserRole.CLIENT,
      companyId: company.id,
      isEmailVerified: false,
      emailVerificationCode: otp,
      emailVerificationExpiry: expiry,
    });

    await this.mailService.sendOtpVerification(user.email, user.firstName || user.email, otp);

    return {
      message: `Compte créé pour ${company.nom}. Vérifiez votre email pour activer votre compte.`,
      requiresVerification: true,
      email: user.email,
      companyNom: company.nom,
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

    await this.mailService.sendPasswordReset(
      user.email,
      user.firstName || user.email,
      resetToken,
    );

    return { message: 'Un email de réinitialisation a été envoyé.' };
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