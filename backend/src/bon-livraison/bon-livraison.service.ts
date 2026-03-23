import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BonLivraison, Article } from './bon-livraison.entity';
import { BonLivraisonStatus } from './enums/bon-livraison-status.enum';
import { Mission } from '../mission/mission.entity';
import { MissionStatus } from '../mission/enums/mission-status.enum';

@Injectable()
export class BonLivraisonService {
  constructor(
    @InjectRepository(BonLivraison)
    private blRepository: Repository<BonLivraison>,
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
  ) {}

  // ✅ Générer référence unique
  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.blRepository.count();
    const number = String(count + 1).padStart(3, '0');
    return `BL-${year}-${number}`;
  }

  // ✅ Créer manuellement
  async create(data: {
    missionId?: number;
    clientId?: number;
    companyId?: number;
    driverId?: number;
    adresseLivraison: string;
    contactLivraison?: string;
    telephoneLivraison?: string;
    articles: Article[];
    observations?: string;
    createdById: number;
  }): Promise<any> {
    // Vérifie si mission existe et n'a pas déjà un BL
    if (data.missionId) {
      const existingBL = await this.blRepository.findOne({
        where: { missionId: data.missionId },
      });
      if (existingBL) {
        throw new ConflictException(`Mission #${data.missionId} already has a BL: ${existingBL.reference}`);
      }
    }

    const reference = await this.generateReference();
    const poidsTotal = data.articles.reduce((sum, a) => sum + (a.poids || 0), 0);

    const bl = this.blRepository.create({
      ...data,
      reference,
      poidsTotal,
      status: BonLivraisonStatus.DRAFT,
    });

    const saved = await this.blRepository.save(bl);
    return {
      message: 'Bon de livraison created successfully',
      bonLivraison: await this.findOne(saved.id),
    };
  }

  // ✅ Créer automatiquement depuis une mission
  async createFromMission(missionId: number, createdById: number): Promise<any> {
    const mission = await this.missionRepository.findOne({
      where: { id: missionId },
      relations: ['camion', 'driver', 'client', 'company'],
    });

    if (!mission) throw new NotFoundException(`Mission #${missionId} not found`);

    if (mission.status !== MissionStatus.DELIVERED && mission.status !== MissionStatus.IN_PROGRESS) {
      throw new BadRequestException('Mission must be IN_PROGRESS or DELIVERED to create a BL');
    }

    const existingBL = await this.blRepository.findOne({
      where: { missionId },
    });
    if (existingBL) {
      throw new ConflictException(`BL already exists for mission #${missionId}: ${existingBL.reference}`);
    }

    const reference = await this.generateReference();

    const bl = this.blRepository.create({
      reference,
      missionId,
      clientId: mission.clientId,
      companyId: (mission as any).companyId || null,
      driverId: mission.driverId,
      adresseLivraison: mission.destination,
      articles: [],
      poidsTotal: mission.poids || 0,
      status: BonLivraisonStatus.DRAFT,
      createdById,
    });

    const saved = await this.blRepository.save(bl);
    return {
      message: 'Bon de livraison created automatically from mission',
      bonLivraison: await this.findOne(saved.id),
    };
  }

  // ✅ Voir tous les BL avec filtres
  async findAll(filters?: {
    status?: BonLivraisonStatus;
    clientId?: number;
    companyId?: number;
    driverId?: number;
    missionId?: number;
  }): Promise<any> {
    const query = this.blRepository.createQueryBuilder('bl')
      .leftJoinAndSelect('bl.mission', 'mission')
      .leftJoinAndSelect('bl.client', 'client')
      .leftJoinAndSelect('bl.company', 'company')
      .leftJoinAndSelect('bl.driver', 'driver')
      .leftJoinAndSelect('bl.createdBy', 'createdBy');

    if (filters?.status) query.andWhere('bl.status = :status', { status: filters.status });
    if (filters?.clientId) query.andWhere('bl.clientId = :clientId', { clientId: filters.clientId });
    if (filters?.companyId) query.andWhere('bl.companyId = :companyId', { companyId: filters.companyId });
    if (filters?.driverId) query.andWhere('bl.driverId = :driverId', { driverId: filters.driverId });
    if (filters?.missionId) query.andWhere('bl.missionId = :missionId', { missionId: filters.missionId });

    query.orderBy('bl.createdAt', 'DESC');
    const bls = await query.getMany();

    return {
      total: bls.length,
      bonsLivraison: bls.map((bl) => this.sanitize(bl)),
    };
  }

  // ✅ Voir un BL
  async findOne(id: number): Promise<any> {
    const bl = await this.blRepository.findOne({
      where: { id },
      relations: ['mission', 'client', 'company', 'driver', 'createdBy'],
    });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);
    return this.sanitize(bl, true);
  }

  // ✅ BL du driver connecté
  async findMyBLs(driverId: number): Promise<any> {
    const bls = await this.blRepository.find({
      where: { driverId },
      relations: ['mission', 'client', 'company'],
      order: { createdAt: 'DESC' },
    });
    return {
      total: bls.length,
      bonsLivraison: bls.map((bl) => this.sanitize(bl)),
    };
  }

  // ✅ BL du client connecté
  async findMyClientBLs(clientId: number): Promise<any> {
    const bls = await this.blRepository.find({
      where: { clientId },
      relations: ['mission', 'driver', 'company'],
      order: { createdAt: 'DESC' },
    });
    return {
      total: bls.length,
      bonsLivraison: bls.map((bl) => this.sanitize(bl)),
    };
  }

  // ✅ Modifier un BL (seulement si DRAFT)
  async update(id: number, data: any): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    if (bl.status !== BonLivraisonStatus.DRAFT) {
      throw new BadRequestException(`Cannot update a BL with status ${bl.status}`);
    }

    if (data.articles) {
      data.poidsTotal = data.articles.reduce(
        (sum: number, a: Article) => sum + (a.poids || 0), 0
      );
    }

    Object.assign(bl, data);
    const updated = await this.blRepository.save(bl);
    return {
      message: 'Bon de livraison updated successfully',
      bonLivraison: await this.findOne(updated.id),
    };
  }

  // ✅ Confirmer un BL (DRAFT → CONFIRMED)
  async confirm(id: number): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    if (bl.status !== BonLivraisonStatus.DRAFT) {
      throw new BadRequestException(`BL must be DRAFT to confirm. Current: ${bl.status}`);
    }

    bl.status = BonLivraisonStatus.CONFIRMED;
    const updated = await this.blRepository.save(bl);
    return {
      message: 'Bon de livraison confirmed',
      bonLivraison: await this.findOne(updated.id),
    };
  }

  // ✅ Signature DRIVER
  async signByDriver(id: number, driverId: number, signature: string): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    if (bl.driverId !== driverId) {
      throw new BadRequestException('You are not the assigned driver for this BL');
    }

    if (bl.status === BonLivraisonStatus.ARCHIVED) {
      throw new BadRequestException('Cannot sign an archived BL');
    }

    bl.signatureDriver = signature;
    bl.dateSignatureDriver = new Date();

    // Si les deux ont signé → SIGNED
    if (bl.signatureClient) {
      bl.status = BonLivraisonStatus.SIGNED;
    }

    const updated = await this.blRepository.save(bl);
    return {
      message: 'BL signed by driver',
      bonLivraison: await this.findOne(updated.id),
    };
  }

  // ✅ Signature CLIENT
  async signByClient(id: number, clientId: number, signature: string): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    if (bl.clientId !== clientId) {
      throw new BadRequestException('You are not the client for this BL');
    }

    if (bl.status === BonLivraisonStatus.ARCHIVED) {
      throw new BadRequestException('Cannot sign an archived BL');
    }

    bl.signatureClient = signature;
    bl.dateSignatureClient = new Date();

    // Si les deux ont signé → SIGNED
    if (bl.signatureDriver) {
      bl.status = BonLivraisonStatus.SIGNED;
    }

    const updated = await this.blRepository.save(bl);
    return {
      message: 'BL signed by client',
      bonLivraison: await this.findOne(updated.id),
    };
  }

  // ✅ Upload photo preuve
  async uploadPhoto(id: number, photoUrl: string): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    bl.photoPreuve = photoUrl;
    const updated = await this.blRepository.save(bl);
    return {
      message: 'Photo uploaded successfully',
      bonLivraison: await this.findOne(updated.id),
    };
  }

  // ✅ Archiver
  async archive(id: number): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    if (bl.status !== BonLivraisonStatus.SIGNED && bl.status !== BonLivraisonStatus.INVOICED) {
      throw new BadRequestException('BL must be SIGNED or INVOICED to archive');
    }

    bl.status = BonLivraisonStatus.ARCHIVED;
    await this.blRepository.save(bl);
    return { message: `Bon de livraison #${id} archived` };
  }

  // ✅ Supprimer (seulement DRAFT)
  async remove(id: number): Promise<any> {
    const bl = await this.blRepository.findOne({ where: { id } });
    if (!bl) throw new NotFoundException(`Bon de livraison #${id} not found`);

    if (bl.status !== BonLivraisonStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT BL can be deleted');
    }

    await this.blRepository.delete(id);
    return { message: `Bon de livraison #${id} deleted` };
  }

  // ✅ Stats
  async getStats(): Promise<any> {
    const total = await this.blRepository.count();
    const draft = await this.blRepository.count({ where: { status: BonLivraisonStatus.DRAFT } });
    const confirmed = await this.blRepository.count({ where: { status: BonLivraisonStatus.CONFIRMED } });
    const signed = await this.blRepository.count({ where: { status: BonLivraisonStatus.SIGNED } });
    const invoiced = await this.blRepository.count({ where: { status: BonLivraisonStatus.INVOICED } });
    const archived = await this.blRepository.count({ where: { status: BonLivraisonStatus.ARCHIVED } });

    return { total, draft, confirmed, signed, invoiced, archived };
  }

  // 🔒 Helper
  private sanitize(bl: BonLivraison, withDates = false) {
    return {
      id: bl.id,
      reference: bl.reference,
      status: bl.status,
      adresseLivraison: bl.adresseLivraison,
      contactLivraison: bl.contactLivraison,
      telephoneLivraison: bl.telephoneLivraison,
      articles: bl.articles,
      poidsTotal: bl.poidsTotal,
      observations: bl.observations,
      motifRefus: bl.motifRefus,
      photoPreuve: bl.photoPreuve,
      signatureDriver: bl.signatureDriver ? '✅ signed' : null,
      dateSignatureDriver: bl.dateSignatureDriver,
      signatureClient: bl.signatureClient ? '✅ signed' : null,
      dateSignatureClient: bl.dateSignatureClient,
      mission: bl.mission ? {
        id: bl.mission.id,
        reference: bl.mission.reference,
        origine: bl.mission.origine,
        destination: bl.mission.destination,
        status: bl.mission.status,
      } : null,
      client: bl.client ? {
        id: bl.client.id,
        firstName: bl.client.firstName,
        lastName: bl.client.lastName,
        email: bl.client.email,
      } : null,
      company: bl.company ? {
        id: bl.company.id,
        nom: bl.company.nom,
      } : null,
      driver: bl.driver ? {
        id: bl.driver.id,
        firstName: bl.driver.firstName,
        lastName: bl.driver.lastName,
        phone: bl.driver.phone,
      } : null,
      createdBy: bl.createdBy ? {
        id: bl.createdBy.id,
        firstName: bl.createdBy.firstName,
        role: bl.createdBy.role,
      } : null,
      ...(withDates && {
        createdAt: bl.createdAt,
        updatedAt: bl.updatedAt,
      }),
    };
  }
}