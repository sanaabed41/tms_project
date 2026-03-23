import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Company } from './company.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';
import * as bcrypt from 'bcrypt';

@Injectable()
export class CompanyService {
  constructor(
    @InjectRepository(Company)
    private companyRepository: Repository<Company>,
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  // ✅ Créer une company
  async create(data: {
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
  }): Promise<any> {
    const existing = await this.companyRepository.findOne({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const company = this.companyRepository.create(data);
    const saved = await this.companyRepository.save(company);
    return {
      message: 'Company created successfully',
      company: this.sanitize(saved),
    };
  }

  // ✅ Voir toutes les companies
  async findAll(filters?: { isActive?: boolean; ville?: string }): Promise<any> {
    const query = this.companyRepository.createQueryBuilder('company')
      .leftJoinAndSelect('company.contacts', 'contacts');

    if (filters?.isActive !== undefined) {
      query.andWhere('company.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters?.ville) {
      query.andWhere('company.ville ILIKE :ville', { ville: `%${filters.ville}%` });
    }

    query.orderBy('company.createdAt', 'DESC');
    const companies = await query.getMany();

    return {
      total: companies.length,
      companies: companies.map((c) => this.sanitize(c)),
    };
  }

  // ✅ Voir une company
  async findOne(id: number): Promise<any> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['contacts'],
    });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    return this.sanitize(company, true);
  }

  // ✅ Modifier une company
  async update(id: number, data: Partial<Company>): Promise<any> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);

    Object.assign(company, data);
    const updated = await this.companyRepository.save(company);
    return {
      message: 'Company updated successfully',
      company: this.sanitize(updated, true),
    };
  }

  // ✅ Activer
  async activate(id: number): Promise<any> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    if (company.isActive) return { message: `Company #${id} is already active` };
    company.isActive = true;
    await this.companyRepository.save(company);
    return { message: `Company #${id} activated successfully` };
  }

  // ✅ Désactiver
  async deactivate(id: number): Promise<any> {
    const company = await this.companyRepository.findOne({ where: { id } });
    if (!company) throw new NotFoundException(`Company #${id} not found`);
    if (!company.isActive) return { message: `Company #${id} is already inactive` };
    company.isActive = false;
    await this.companyRepository.save(company);
    return { message: `Company #${id} deactivated successfully` };
  }

  // ✅ Supprimer
  async remove(id: number): Promise<any> {
    const company = await this.companyRepository.findOne({
      where: { id },
      relations: ['contacts'],
    });
    if (!company) throw new NotFoundException(`Company #${id} not found`);

    if (company.contacts?.length > 0) {
      throw new ConflictException(
        `Cannot delete company with ${company.contacts.length} active contacts`,
      );
    }

    await this.companyRepository.delete(id);
    return { message: `Company #${id} deleted successfully` };
  }

  // ✅ Ajouter un contact CLIENT à une company
  async addContact(companyId: number, data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
  }): Promise<any> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);

    const existing = await this.userRepository.findOne({
      where: { email: data.email },
    });
    if (existing) throw new ConflictException('Email already in use');

    const hashedPassword = await bcrypt.hash(data.password, 10);
    const contact = this.userRepository.create({
      ...data,
      password: hashedPassword,
      role: UserRole.CLIENT,
      companyId,
    });

    const saved = await this.userRepository.save(contact);
    return {
      message: 'Contact added successfully',
      contact: {
        id: saved.id,
        email: saved.email,
        firstName: saved.firstName,
        lastName: saved.lastName,
        phone: saved.phone,
        role: saved.role,
        companyId: saved.companyId,
      },
    };
  }

  // ✅ Voir les contacts d'une company
  async getContacts(companyId: number): Promise<any> {
    const company = await this.companyRepository.findOne({
      where: { id: companyId },
    });
    if (!company) throw new NotFoundException(`Company #${companyId} not found`);

    const contacts = await this.userRepository.find({
      where: { companyId, role: UserRole.CLIENT },
      order: { createdAt: 'DESC' },
    });

    return {
      company: { id: company.id, nom: company.nom },
      total: contacts.length,
      contacts: contacts.map((c) => ({
        id: c.id,
        email: c.email,
        firstName: c.firstName,
        lastName: c.lastName,
        phone: c.phone,
        isActive: c.isActive,
        createdAt: c.createdAt,
      })),
    };
  }

  // ✅ Retirer un contact d'une company
  async removeContact(companyId: number, contactId: number): Promise<any> {
    const contact = await this.userRepository.findOne({
      where: { id: contactId, companyId },
    });
    if (!contact) throw new NotFoundException(`Contact #${contactId} not found in company #${companyId}`);

    contact.companyId = null;
    await this.userRepository.save(contact);
    return { message: `Contact #${contactId} removed from company #${companyId}` };
  }

  // ✅ Stats
  async getStats(): Promise<any> {
    const total = await this.companyRepository.count();
    const active = await this.companyRepository.count({ where: { isActive: true } });
    const inactive = await this.companyRepository.count({ where: { isActive: false } });
    const totalContacts = await this.userRepository.count({
      where: { role: UserRole.CLIENT },
    });

    return { total, active, inactive, totalContacts };
  }

  // 🔒 Helper
  private sanitize(company: Company, withDates = false) {
    return {
      id: company.id,
      nom: company.nom,
      adresse: company.adresse,
      ville: company.ville,
      pays: company.pays,
      email: company.email,
      telephone: company.telephone,
      siteWeb: company.siteWeb,
      RC: company.RC,
      TVA: company.TVA,
      logo: company.logo,
      isActive: company.isActive,
      totalContacts: company.contacts?.length ?? 0,
      ...(withDates && {
        createdAt: company.createdAt,
        updatedAt: company.updatedAt,
      }),
    };
  }
}