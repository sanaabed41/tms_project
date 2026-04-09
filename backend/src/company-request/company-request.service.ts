import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CompanyRequest } from './company-request.entity';
import { RequestStatus } from './enums/request-status.enum';
import { Company } from '../company/company.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import { MailService } from '../mail/mail.service';
import * as bcrypt from 'bcrypt';
import { nanoid } from 'nanoid';

@Injectable()
export class CompanyRequestService {
  constructor(
    @InjectRepository(CompanyRequest)
    private requestRepository: Repository<CompanyRequest>,
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private mailService: MailService,
  ) {}

  // ── Soumettre une demande (public) ────────────────────────────────────────

  async submit(data: {
    companyNom: string;
    companyAdresse: string;
    companyVille: string;
    companyPays?: string;
    companyEmail: string;
    companyTelephone: string;
    companySiteWeb?: string;
    companyRC?: string;
    companyTVA?: string;
    companyDescription?: string;
    adminFirstName: string;
    adminLastName: string;
    adminEmail: string;
    adminPhone?: string;
  }) {
    // Vérifie doublons email company
    const existingCompany = await this.companyRepository.findOne({
      where: { email: data.companyEmail },
    });
    if (existingCompany) {
      throw new ConflictException('Une entreprise avec cet email existe déjà');
    }

    // Vérifie doublons demande en attente
    const existingRequest = await this.requestRepository.findOne({
      where: { companyEmail: data.companyEmail, status: RequestStatus.PENDING },
    });
    if (existingRequest) {
      throw new ConflictException('Une demande est déjà en cours pour cet email');
    }

    // Vérifie que l'email admin n'est pas déjà utilisé
    const existingAdmin = await this.userRepository.findOne({
      where: { email: data.adminEmail },
    });
    if (existingAdmin) {
      throw new ConflictException('Cet email admin est déjà associé à un compte');
    }

    const request = this.requestRepository.create({
      ...data,
      companyPays: data.companyPays ?? 'Tunisie',
      status: RequestStatus.PENDING,
    });
    const saved = await this.requestRepository.save(request);

    // Email de confirmation au demandeur
    await this.mailService.sendCompanyRequestReceived(
      data.adminEmail,
      data.adminFirstName,
      data.companyNom,
    );

    return {
      message: 'Votre demande a été soumise avec succès. Vous recevrez un email de confirmation.',
      requestId: saved.id,
    };
  }

  // ── Voir toutes les demandes (SuperAdmin) ─────────────────────────────────

  async findAll(filters?: { status?: RequestStatus; search?: string }) {
    const query = this.requestRepository.createQueryBuilder('req');

    if (filters?.status) {
      query.andWhere('req.status = :status', { status: filters.status });
    }
    if (filters?.search) {
      query.andWhere(
        '(req.companyNom ILIKE :s OR req.adminEmail ILIKE :s OR req.companyEmail ILIKE :s)',
        { s: `%${filters.search}%` },
      );
    }

    query.orderBy('req.createdAt', 'DESC');
    const requests = await query.getMany();
    return { total: requests.length, requests };
  }

  // ── Voir une demande ──────────────────────────────────────────────────────

  async findOne(id: number) {
    const req = await this.requestRepository.findOne({ where: { id } });
    if (!req) throw new NotFoundException(`Demande #${id} introuvable`);
    return req;
  }

  // ── Approuver — crée l'entreprise + l'admin + envoie les identifiants ─────

  async approve(id: number) {
    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Demande #${id} introuvable`);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Cette demande est déjà ${request.status}`);
    }

    // Générer un mot de passe temporaire
    const tempPassword = `TMS-${nanoid(8)}`;
    const hashedPassword = await bcrypt.hash(tempPassword, 10);

    // Générer le code unique de l'entreprise
    const companyCode = nanoid(8).toUpperCase();

    // Créer l'entreprise
    const company = this.companyRepository.create({
      nom: request.companyNom,
      adresse: request.companyAdresse,
      ville: request.companyVille,
      pays: request.companyPays,
      email: request.companyEmail,
      telephone: request.companyTelephone,
      siteWeb: request.companySiteWeb,
      RC: request.companyRC,
      TVA: request.companyTVA,
      companyCode,
      isActive: true,
    });
    const savedCompany = await this.companyRepository.save(company);

    // Créer le compte ADMIN
    const admin = this.userRepository.create({
      email: request.adminEmail,
      password: hashedPassword,
      firstName: request.adminFirstName,
      lastName: request.adminLastName,
      phone: request.adminPhone,
      role: UserRole.ADMIN,
      companyId: savedCompany.id,
      isEmailVerified: true,
      isActive: true,
    });
    await this.userRepository.save(admin);

    // Mettre à jour le statut de la demande
    request.status = RequestStatus.APPROVED;
    request.reviewedAt = new Date();
    await this.requestRepository.save(request);

    // Envoyer les identifiants par email
    await this.mailService.sendCompanyRequestApproved(
      request.adminEmail,
      request.adminFirstName,
      request.companyNom,
      tempPassword,
    );

    return {
      message: `Demande approuvée. Entreprise "${request.companyNom}" créée. Identifiants envoyés à ${request.adminEmail}.`,
      companyId: savedCompany.id,
      companyCode,
    };
  }

  // ── Refuser ───────────────────────────────────────────────────────────────

  async reject(id: number, rejectReason: string) {
    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Demande #${id} introuvable`);

    if (request.status !== RequestStatus.PENDING) {
      throw new BadRequestException(`Cette demande est déjà ${request.status}`);
    }

    if (!rejectReason?.trim()) {
      throw new BadRequestException('Un motif de refus est requis');
    }

    request.status = RequestStatus.REJECTED;
    request.rejectReason = rejectReason;
    request.reviewedAt = new Date();
    await this.requestRepository.save(request);

    await this.mailService.sendCompanyRequestRejected(
      request.adminEmail,
      request.adminFirstName,
      request.companyNom,
      rejectReason,
    );

    return { message: `Demande refusée. Email de notification envoyé à ${request.adminEmail}.` };
  }

  // ── Supprimer une demande ─────────────────────────────────────────────────

  async remove(id: number) {
    const request = await this.requestRepository.findOne({ where: { id } });
    if (!request) throw new NotFoundException(`Demande #${id} introuvable`);
    await this.requestRepository.delete(id);
    return { message: `Demande #${id} supprimée` };
  }

  // ── Stats pour le SuperAdmin ──────────────────────────────────────────────

  async getStats() {
    const [total, pending, approved, rejected] = await Promise.all([
      this.requestRepository.count(),
      this.requestRepository.count({ where: { status: RequestStatus.PENDING } }),
      this.requestRepository.count({ where: { status: RequestStatus.APPROVED } }),
      this.requestRepository.count({ where: { status: RequestStatus.REJECTED } }),
    ]);
    return { total, pending, approved, rejected };
  }
}
