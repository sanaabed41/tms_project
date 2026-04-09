import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Facture } from './facture.entity';
import { FactureStatus, ModePaiement } from './enums/facture-status.enum';
import { BonLivraison } from '../bon-livraison/bon-livraison.entity';
import { BonLivraisonStatus } from '../bon-livraison/enums/bon-livraison-status.enum';

@Injectable()
export class FactureService {
  constructor(
    @InjectRepository(Facture)
    private factureRepository: Repository<Facture>,
    @InjectRepository(BonLivraison)
    private blRepository: Repository<BonLivraison>,
  ) {}

  // ✅ Générer référence unique
  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const last = await this.factureRepository
      .createQueryBuilder('facture')
      .where('facture.reference LIKE :pattern', { pattern: `FAC-${year}-%` })
      .orderBy('facture.id', 'DESC')
      .getOne();

    const nextNumber = last
      ? parseInt(last.reference.split('-')[2], 10) + 1
      : 1;

    return `FAC-${year}-${String(nextNumber).padStart(3, '0')}`;
  }

  // ✅ Calculer les montants
  private calculateMontants(montantHT: number, tauxTVA: number) {
    const montantTVA = (montantHT * tauxTVA) / 100;
    const montantTTC = montantHT + montantTVA;
    return {
      montantTVA: parseFloat(montantTVA.toFixed(3)),
      montantTTC: parseFloat(montantTTC.toFixed(3)),
    };
  }

  // ✅ Créer une facture manuellement
  async create(data: {
    montantHT: number;
    tauxTVA?: number;
    bonLivraisonId?: number;
    missionId?: number;
    clientId?: number;
    companyId?: number;
    dateEcheance?: Date;
    notes?: string;
    createdById: number;
  }, requestUser?: { role: string; companyId: number | null }): Promise<any> {
    if (requestUser?.role !== 'SUPER_ADMIN' && requestUser?.companyId) {
      data.companyId = requestUser.companyId;
    }
    // Vérifie si BL existe et n'a pas déjà une facture
    if (data.bonLivraisonId) {
      const existing = await this.factureRepository.findOne({
        where: { bonLivraisonId: data.bonLivraisonId },
      });
      if (existing) {
        throw new ConflictException(
          `BL #${data.bonLivraisonId} already has a facture: ${existing.reference}`,
        );
      }
    }

    const tauxTVA = data.tauxTVA ?? 19;
    const { montantTVA, montantTTC } = this.calculateMontants(data.montantHT, tauxTVA);
    const reference = await this.generateReference();

    const facture = this.factureRepository.create({
      ...data,
      reference,
      tauxTVA,
      montantTVA,
      montantTTC,
      dateEmission: new Date(),
      status: FactureStatus.DRAFT,
    });

    const saved = await this.factureRepository.save(facture);
    return {
      message: 'Facture created successfully',
      facture: await this.findOne(saved.id),
    };
  }

  // ✅ Créer depuis un BL
  async createFromBL(blId: number, data: {
    montantHT: number;
    tauxTVA?: number;
    dateEcheance?: Date;
    notes?: string;
    createdById: number;
  }): Promise<any> {
    const bl = await this.blRepository.findOne({
      where: { id: blId },
      relations: ['mission', 'client', 'company'],
    });

    if (!bl) throw new NotFoundException(`BonLivraison #${blId} not found`);

    if (bl.status !== BonLivraisonStatus.SIGNED &&
        bl.status !== BonLivraisonStatus.ARCHIVED) {
      throw new BadRequestException('BL must be SIGNED or ARCHIVED to create a facture');
    }

    const existing = await this.factureRepository.findOne({
      where: { bonLivraisonId: blId },
    });
    if (existing) {
      throw new ConflictException(`BL #${blId} already has a facture: ${existing.reference}`);
    }

    const tauxTVA = data.tauxTVA ?? 19;
    const { montantTVA, montantTTC } = this.calculateMontants(data.montantHT, tauxTVA);
    const reference = await this.generateReference();

    const facture = this.factureRepository.create({
      reference,
      bonLivraisonId: blId,
      missionId: bl.missionId,
      clientId: bl.clientId,
      companyId: bl.companyId,
      montantHT: data.montantHT,
      tauxTVA,
      montantTVA,
      montantTTC,
      dateEmission: new Date(),
      dateEcheance: data.dateEcheance,
      notes: data.notes,
      createdById: data.createdById,
      status: FactureStatus.DRAFT,
    });

    // Marque le BL comme INVOICED
    bl.status = BonLivraisonStatus.INVOICED;
    await this.blRepository.save(bl);

    const saved = await this.factureRepository.save(facture);
    return {
      message: 'Facture created from BL successfully',
      facture: await this.findOne(saved.id),
    };
  }

  // ✅ Voir toutes les factures avec filtres
  async findAll(
    filters?: { status?: FactureStatus; clientId?: number; companyId?: number; missionId?: number },
    requestUser?: { role: string; companyId: number | null },
  ): Promise<any> {
    const query = this.factureRepository.createQueryBuilder('facture')
      .leftJoinAndSelect('facture.bonLivraison', 'bonLivraison')
      .leftJoinAndSelect('facture.mission', 'mission')
      .leftJoinAndSelect('facture.client', 'client')
      .leftJoinAndSelect('facture.company', 'company')
      .leftJoinAndSelect('facture.createdBy', 'createdBy');

    if (filters?.status) query.andWhere('facture.status = :status', { status: filters.status });
    if (filters?.clientId) query.andWhere('facture.clientId = :clientId', { clientId: filters.clientId });
    if (filters?.missionId) query.andWhere('facture.missionId = :missionId', { missionId: filters.missionId });

    if (requestUser?.role !== 'SUPER_ADMIN' && requestUser?.companyId) {
      query.andWhere('facture.companyId = :cid', { cid: requestUser.companyId });
    } else if (filters?.companyId) {
      query.andWhere('facture.companyId = :cid', { cid: filters.companyId });
    }

    query.orderBy('facture.createdAt', 'DESC');
    const factures = await query.getMany();
    return { total: factures.length, factures: factures.map((f) => this.sanitize(f)) };
  }

  // ✅ Voir une facture
  async findOne(id: number): Promise<any> {
    const facture = await this.factureRepository.findOne({
      where: { id },
      relations: ['bonLivraison', 'mission', 'client', 'company', 'createdBy'],
    });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);
    return this.sanitize(facture, true);
  }

  // ✅ Factures du client connecté
  async findMyFactures(clientId: number): Promise<any> {
    const factures = await this.factureRepository.find({
      where: { clientId },
      relations: ['bonLivraison', 'mission', 'company'],
      order: { createdAt: 'DESC' },
    });
    return {
      total: factures.length,
      factures: factures.map((f) => this.sanitize(f)),
    };
  }

  // ✅ Envoyer une facture (DRAFT → SENT)
  async send(id: number): Promise<any> {
    const facture = await this.factureRepository.findOne({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);

    if (facture.status !== FactureStatus.DRAFT) {
      throw new BadRequestException(`Facture must be DRAFT to send. Current: ${facture.status}`);
    }

    facture.status = FactureStatus.SENT;
    await this.factureRepository.save(facture);
    return {
      message: `Facture #${id} sent successfully`,
      facture: await this.findOne(id),
    };
  }

  // ✅ Marquer comme payée
  async markAsPaid(id: number, data: {
    modePaiement: ModePaiement;
    datePaiement?: Date;
    notes?: string;
  }): Promise<any> {
    const facture = await this.factureRepository.findOne({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);

    if (facture.status !== FactureStatus.SENT &&
        facture.status !== FactureStatus.OVERDUE) {
      throw new BadRequestException(
        `Facture must be SENT or OVERDUE to mark as paid. Current: ${facture.status}`,
      );
    }

    facture.status = FactureStatus.PAID;
    facture.modePaiement = data.modePaiement;
    facture.datePaiement = data.datePaiement ?? new Date();
    if (data.notes) facture.notes = data.notes;

    await this.factureRepository.save(facture);
    return {
      message: `Facture #${id} marked as paid`,
      facture: await this.findOne(id),
    };
  }

  // ✅ Marquer comme en retard (SENT → OVERDUE)
  async markAsOverdue(id: number): Promise<any> {
    const facture = await this.factureRepository.findOne({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);

    if (facture.status !== FactureStatus.SENT) {
      throw new BadRequestException(`Facture must be SENT to mark as overdue`);
    }

    facture.status = FactureStatus.OVERDUE;
    await this.factureRepository.save(facture);
    return {
      message: `Facture #${id} marked as overdue`,
      facture: await this.findOne(id),
    };
  }

  // ✅ Annuler
  async cancel(id: number, cancelReason: string): Promise<any> {
    const facture = await this.factureRepository.findOne({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);

    if (facture.status === FactureStatus.PAID) {
      throw new BadRequestException('Cannot cancel a paid facture');
    }

    facture.status = FactureStatus.CANCELLED;
    facture.cancelReason = cancelReason;
    await this.factureRepository.save(facture);
    return {
      message: `Facture #${id} cancelled`,
      facture: await this.findOne(id),
    };
  }

  // ✅ Modifier (seulement DRAFT)
  async update(id: number, data: any): Promise<any> {
    const facture = await this.factureRepository.findOne({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);

    if (facture.status !== FactureStatus.DRAFT) {
      throw new BadRequestException(`Only DRAFT factures can be modified`);
    }

    if (data.montantHT || data.tauxTVA) {
      const montantHT = data.montantHT ?? facture.montantHT;
      const tauxTVA = data.tauxTVA ?? facture.tauxTVA;
      const { montantTVA, montantTTC } = this.calculateMontants(montantHT, tauxTVA);
      data.montantTVA = montantTVA;
      data.montantTTC = montantTTC;
    }

    Object.assign(facture, data);
    await this.factureRepository.save(facture);
    return {
      message: 'Facture updated successfully',
      facture: await this.findOne(id),
    };
  }

  // ✅ Supprimer (seulement DRAFT)
  async remove(id: number): Promise<any> {
    const facture = await this.factureRepository.findOne({ where: { id } });
    if (!facture) throw new NotFoundException(`Facture #${id} not found`);

    if (facture.status !== FactureStatus.DRAFT) {
      throw new BadRequestException('Only DRAFT factures can be deleted');
    }

    await this.factureRepository.delete(id);
    return { message: `Facture #${id} deleted` };
  }

  // ✅ Stats financières
  async getStats(requestUser?: { role: string; companyId: number | null }): Promise<any> {
    const scope: any = requestUser?.role !== 'SUPER_ADMIN' && requestUser?.companyId
      ? { companyId: requestUser.companyId }
      : {};

    const [total, draft, sent, paid, overdue, cancelled] = await Promise.all([
      this.factureRepository.count({ where: scope }),
      this.factureRepository.count({ where: { ...scope, status: FactureStatus.DRAFT } }),
      this.factureRepository.count({ where: { ...scope, status: FactureStatus.SENT } }),
      this.factureRepository.count({ where: { ...scope, status: FactureStatus.PAID } }),
      this.factureRepository.count({ where: { ...scope, status: FactureStatus.OVERDUE } }),
      this.factureRepository.count({ where: { ...scope, status: FactureStatus.CANCELLED } }),
    ]);

    const [paidFactures, pendingFactures, overdueFactures] = await Promise.all([
      this.factureRepository.find({ where: { ...scope, status: FactureStatus.PAID } }),
      this.factureRepository.find({ where: { ...scope, status: FactureStatus.SENT } }),
      this.factureRepository.find({ where: { ...scope, status: FactureStatus.OVERDUE } }),
    ]);

    const chiffreAffaires = paidFactures.reduce((sum, f) => sum + Number(f.montantTTC), 0);
    const montantEnAttente = pendingFactures.reduce((sum, f) => sum + Number(f.montantTTC), 0);
    const montantEnRetard = overdueFactures.reduce((sum, f) => sum + Number(f.montantTTC), 0);

    return {
      total, draft, sent, paid, overdue, cancelled,
      chiffreAffaires: parseFloat(chiffreAffaires.toFixed(3)),
      montantEnAttente: parseFloat(montantEnAttente.toFixed(3)),
      montantEnRetard: parseFloat(montantEnRetard.toFixed(3)),
    };
  }

  // 🔒 Helper
  private sanitize(facture: Facture, withDates = false) {
    return {
      id: facture.id,
      reference: facture.reference,
      status: facture.status,
      montantHT: Number(facture.montantHT),
      tauxTVA: Number(facture.tauxTVA),
      montantTVA: Number(facture.montantTVA),
      montantTTC: Number(facture.montantTTC),
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      datePaiement: facture.datePaiement,
      modePaiement: facture.modePaiement,
      notes: facture.notes,
      cancelReason: facture.cancelReason,
      bonLivraison: facture.bonLivraison ? {
        id: facture.bonLivraison.id,
        reference: facture.bonLivraison.reference,
        status: facture.bonLivraison.status,
      } : null,
      mission: facture.mission ? {
        id: facture.mission.id,
        reference: facture.mission.reference,
        origine: facture.mission.origine,
        destination: facture.mission.destination,
      } : null,
      client: facture.client ? {
        id: facture.client.id,
        firstName: facture.client.firstName,
        lastName: facture.client.lastName,
        email: facture.client.email,
      } : null,
      company: facture.company ? {
        id: facture.company.id,
        nom: facture.company.nom,
        tva: facture.company.TVA,
      } : null,
      createdBy: facture.createdBy ? {
        id: facture.createdBy.id,
        firstName: facture.createdBy.firstName,
        role: facture.createdBy.role,
      } : null,
      ...(withDates && {
        createdAt: facture.createdAt,
        updatedAt: facture.updatedAt,
      }),
    };
  }
}