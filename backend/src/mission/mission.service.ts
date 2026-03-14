import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Mission } from './mission.entity';
import { MissionStatus } from './enums/mission-status.enum';

@Injectable()
export class MissionService {
  constructor(
    @InjectRepository(Mission)
    private missionRepository: Repository<Mission>,
  ) {}

  // ✅ Générer une référence unique
  private async generateReference(): Promise<string> {
    const year = new Date().getFullYear();
    const count = await this.missionRepository.count();
    const number = String(count + 1).padStart(3, '0');
    return `MSN-${year}-${number}`;
  }

  // ✅ Créer une mission
  async create(data: {
    origine: string;
    destination: string;
    dateDepart: Date;
    dateArriveePrevu: Date;
    description?: string;
    distanceKm?: number;
    poids?: number;
    clientId?: number;
    camionId?: number;
    driverId?: number;
    createdById: number;
  }): Promise<any> {
    const reference = await this.generateReference();

    // Si camion + driver fournis → statut ASSIGNED directement
    const status = data.camionId && data.driverId
      ? MissionStatus.ASSIGNED
      : MissionStatus.PENDING;

    const mission = this.missionRepository.create({
      ...data,
      reference,
      status,
    });

    const saved = await this.missionRepository.save(mission);
    return {
      message: 'Mission created successfully',
      mission: await this.findOne(saved.id),
    };
  }

  // ✅ Voir toutes les missions avec filtres
  async findAll(filters?: {
    status?: MissionStatus;
    driverId?: number;
    clientId?: number;
    camionId?: number;
    createdById?: number;
  }): Promise<any> {
    const query = this.missionRepository.createQueryBuilder('mission')
      .leftJoinAndSelect('mission.camion', 'camion')
      .leftJoinAndSelect('mission.driver', 'driver')
      .leftJoinAndSelect('mission.client', 'client')
      .leftJoinAndSelect('mission.createdBy', 'createdBy');

    if (filters?.status) {
      query.andWhere('mission.status = :status', { status: filters.status });
    }
    if (filters?.driverId) {
      query.andWhere('mission.driverId = :driverId', { driverId: filters.driverId });
    }
    if (filters?.clientId) {
      query.andWhere('mission.clientId = :clientId', { clientId: filters.clientId });
    }
    if (filters?.camionId) {
      query.andWhere('mission.camionId = :camionId', { camionId: filters.camionId });
    }

    query.orderBy('mission.createdAt', 'DESC');

    const missions = await query.getMany();
    return {
      total: missions.length,
      missions: missions.map((m) => this.sanitize(m)),
    };
  }

  // ✅ Voir une mission
  async findOne(id: number): Promise<any> {
    const mission = await this.missionRepository.findOne({
      where: { id },
      relations: ['camion', 'driver', 'client', 'createdBy'],
    });
    if (!mission) throw new NotFoundException(`Mission #${id} not found`);
    return this.sanitize(mission, true);
  }

  // ✅ Missions du driver connecté
  async findMyMissions(driverId: number): Promise<any> {
    const missions = await this.missionRepository.find({
      where: { driverId },
      relations: ['camion', 'client'],
      order: { createdAt: 'DESC' },
    });
    return {
      total: missions.length,
      missions: missions.map((m) => this.sanitize(m)),
    };
  }

  // ✅ Missions du client connecté
  async findMyOrders(clientId: number): Promise<any> {
    const missions = await this.missionRepository.find({
      where: { clientId },
      relations: ['camion', 'driver'],
      order: { createdAt: 'DESC' },
    });
    return {
      total: missions.length,
      missions: missions.map((m) => this.sanitize(m)),
    };
  }

  // ✅ Modifier une mission
  async update(id: number, data: Partial<Mission>): Promise<any> {
    const mission = await this.missionRepository.findOne({ where: { id } });
    if (!mission) throw new NotFoundException(`Mission #${id} not found`);

    if (mission.status === MissionStatus.DONE || mission.status === MissionStatus.CANCELLED) {
      throw new BadRequestException(`Cannot update a ${mission.status} mission`);
    }

    Object.assign(mission, data);
    const updated = await this.missionRepository.save(mission);
    return {
      message: 'Mission updated successfully',
      mission: await this.findOne(updated.id),
    };
  }

  // ✅ Assigner camion + driver
  async assign(id: number, camionId: number, driverId: number): Promise<any> {
    const mission = await this.missionRepository.findOne({ where: { id } });
    if (!mission) throw new NotFoundException(`Mission #${id} not found`);

    if (mission.status === MissionStatus.CANCELLED) {
      throw new BadRequestException('Cannot assign a cancelled mission');
    }
    if (mission.status === MissionStatus.DONE) {
      throw new BadRequestException('Cannot assign a completed mission');
    }

    mission.camionId = camionId;
    mission.driverId = driverId;
    mission.status = MissionStatus.ASSIGNED;

    const updated = await this.missionRepository.save(mission);
    return {
      message: 'Mission assigned successfully',
      mission: await this.findOne(updated.id),
    };
  }

  // ✅ Changer le statut avec validation
  async changeStatus(id: number, status: MissionStatus, data?: {
    notes?: string;
    cancelReason?: string;
    dateArriveeReelle?: Date;
  }): Promise<any> {
    const mission = await this.missionRepository.findOne({ where: { id } });
    if (!mission) throw new NotFoundException(`Mission #${id} not found`);

    // Validation des transitions de statut
    const validTransitions: Record<MissionStatus, MissionStatus[]> = {
      [MissionStatus.PENDING]: [MissionStatus.ASSIGNED, MissionStatus.CANCELLED],
      [MissionStatus.ASSIGNED]: [MissionStatus.IN_PROGRESS, MissionStatus.CANCELLED],
      [MissionStatus.IN_PROGRESS]: [MissionStatus.DELIVERED, MissionStatus.CANCELLED],
      [MissionStatus.DELIVERED]: [MissionStatus.DONE],
      [MissionStatus.DONE]: [],
      [MissionStatus.CANCELLED]: [],
    };

    if (!validTransitions[mission.status].includes(status)) {
      throw new BadRequestException(
        `Cannot change status from ${mission.status} to ${status}. Valid transitions: ${validTransitions[mission.status].join(', ') || 'none'}`
      );
    }

    mission.status = status;

    if (data?.notes) mission.notes = data.notes;
    if (data?.cancelReason) mission.cancelReason = data.cancelReason;
    if (status === MissionStatus.DELIVERED && data?.dateArriveeReelle) {
      mission.dateArriveeReelle = data.dateArriveeReelle;
    }

    const updated = await this.missionRepository.save(mission);
    return {
      message: `Mission status changed to ${status}`,
      mission: await this.findOne(updated.id),
    };
  }

  // ✅ Statistiques
  async getStats(): Promise<any> {
    const total = await this.missionRepository.count();
    const pending = await this.missionRepository.count({ where: { status: MissionStatus.PENDING } });
    const assigned = await this.missionRepository.count({ where: { status: MissionStatus.ASSIGNED } });
    const inProgress = await this.missionRepository.count({ where: { status: MissionStatus.IN_PROGRESS } });
    const delivered = await this.missionRepository.count({ where: { status: MissionStatus.DELIVERED } });
    const done = await this.missionRepository.count({ where: { status: MissionStatus.DONE } });
    const cancelled = await this.missionRepository.count({ where: { status: MissionStatus.CANCELLED } });

    return { total, pending, assigned, inProgress, delivered, done, cancelled };
  }

  // ✅ Supprimer
  async remove(id: number): Promise<any> {
    const mission = await this.missionRepository.findOne({ where: { id } });
    if (!mission) throw new NotFoundException(`Mission #${id} not found`);

    if (mission.status === MissionStatus.IN_PROGRESS) {
      throw new BadRequestException('Cannot delete a mission in progress');
    }

    await this.missionRepository.delete(id);
    return { message: `Mission #${id} deleted successfully` };
  }

  // 🔒 Helper
  private sanitize(mission: Mission, withDates = false) {
    return {
      id: mission.id,
      reference: mission.reference,
      origine: mission.origine,
      destination: mission.destination,
      dateDepart: mission.dateDepart,
      dateArriveePrevu: mission.dateArriveePrevu,
      dateArriveeReelle: mission.dateArriveeReelle,
      status: mission.status,
      description: mission.description,
      distanceKm: mission.distanceKm,
      poids: mission.poids,
      notes: mission.notes,
      cancelReason: mission.cancelReason,
      camion: mission.camion ? {
        id: mission.camion.id,
        matricule: mission.camion.matricule,
        marque: mission.camion.marque,
        modele: mission.camion.modele,
      } : null,
      driver: mission.driver ? {
        id: mission.driver.id,
        firstName: mission.driver.firstName,
        lastName: mission.driver.lastName,
        phone: mission.driver.phone,
      } : null,
      client: mission.client ? {
        id: mission.client.id,
        firstName: mission.client.firstName,
        lastName: mission.client.lastName,
        email: mission.client.email,
      } : null,
      createdBy: mission.createdBy ? {
        id: mission.createdBy.id,
        firstName: mission.createdBy.firstName,
        role: mission.createdBy.role,
      } : null,
      ...(withDates && {
        createdAt: mission.createdAt,
        updatedAt: mission.updatedAt,
      }),
    };
  }
}