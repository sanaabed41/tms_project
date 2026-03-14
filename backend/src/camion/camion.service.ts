import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Camion } from './camion.entity';
import { CreateCamionDto } from './dto/create-camion.dto';
import { UpdateCamionDto } from './dto/update-camion.dto';
import { CamionStatus } from './enums/camion-status.enum';
import { CamionType } from './enums/camion-type.enum';

@Injectable()
export class CamionService {
  constructor(
    @InjectRepository(Camion)
    private camionRepository: Repository<Camion>,
  ) {}

  // ✅ Créer un camion
  async create(dto: CreateCamionDto): Promise<any> {
    const existing = await this.camionRepository.findOne({
      where: { matricule: dto.matricule },
    });
    if (existing) throw new ConflictException(`Matricule ${dto.matricule} already exists`);

    const camion = this.camionRepository.create(dto);
    const saved = await this.camionRepository.save(camion);
    return {
      message: 'Camion created successfully',
      camion: this.sanitize(saved),
    };
  }

  // ✅ Tous les camions avec filtres
  async findAll(filters?: {
    status?: CamionStatus;
    type?: CamionType;
    isActive?: boolean;
    driverId?: number;
  }): Promise<any> {
    const query = this.camionRepository.createQueryBuilder('camion')
      .leftJoinAndSelect('camion.driver', 'driver');

    if (filters?.status) {
      query.andWhere('camion.status = :status', { status: filters.status });
    }
    if (filters?.type) {
      query.andWhere('camion.type = :type', { type: filters.type });
    }
    if (filters?.isActive !== undefined) {
      query.andWhere('camion.isActive = :isActive', { isActive: filters.isActive });
    }
    if (filters?.driverId) {
      query.andWhere('camion.driverId = :driverId', { driverId: filters.driverId });
    }

    query.orderBy('camion.createdAt', 'DESC');

    const camions = await query.getMany();
    return {
      total: camions.length,
      camions: camions.map((c) => this.sanitize(c)),
    };
  }

  // ✅ Un camion par ID
  async findOne(id: number): Promise<any> {
    const camion = await this.camionRepository.findOne({
      where: { id },
      relations: ['driver'],
    });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);
    return this.sanitize(camion, true);
  }

  // ✅ Trouver par matricule
  async findByMatricule(matricule: string): Promise<any> {
    const camion = await this.camionRepository.findOne({
      where: { matricule },
      relations: ['driver'],
    });
    if (!camion) throw new NotFoundException(`Camion ${matricule} not found`);
    return this.sanitize(camion, true);
  }

  // ✅ Modifier un camion
  async update(id: number, dto: UpdateCamionDto): Promise<any> {
    const camion = await this.camionRepository.findOne({ where: { id } });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);

    if (dto.matricule && dto.matricule !== camion.matricule) {
      const existing = await this.camionRepository.findOne({
        where: { matricule: dto.matricule },
      });
      if (existing) throw new ConflictException(`Matricule ${dto.matricule} already exists`);
    }

    Object.assign(camion, dto);
    const updated = await this.camionRepository.save(camion);
    return {
      message: 'Camion updated successfully',
      camion: this.sanitize(updated, true),
    };
  }

  // ✅ Changer le statut
  async changeStatus(id: number, status: CamionStatus): Promise<any> {
    const camion = await this.camionRepository.findOne({ where: { id } });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);

    camion.status = status;
    const updated = await this.camionRepository.save(camion);
    return {
      message: `Camion #${id} status changed to ${status}`,
      camion: this.sanitize(updated, true),
    };
  }

  // ✅ Assigner un driver
  async assignDriver(id: number, driverId: number): Promise<any> {
    const camion = await this.camionRepository.findOne({ where: { id } });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);

    camion.driverId = driverId;
    const updated = await this.camionRepository.save(camion);
    return {
      message: `Driver #${driverId} assigned to Camion #${id}`,
      camion: this.sanitize(updated, true),
    };
  }

  // ✅ Désassigner le driver
 async unassignDriver(id: number): Promise<any> {
  const camion = await this.camionRepository.findOne({ where: { id } });
  if (!camion) throw new NotFoundException(`Camion #${id} not found`);

  await this.camionRepository.update(id, { driverId: null });

  const updated = await this.camionRepository.findOne({
    where: { id },
    relations: ['driver'],
  });

  if (!updated) throw new NotFoundException(`Camion #${id} not found`); // ✅ null guard

  return {
    message: `Driver unassigned from Camion #${id}`,
    camion: this.sanitize(updated, true), // ✅ TypeScript sait que updated != null
  };
}

  // ✅ Activer
  async activate(id: number): Promise<any> {
    const camion = await this.camionRepository.findOne({ where: { id } });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);
    if (camion.isActive) return { message: `Camion #${id} is already active` };
    camion.isActive = true;
    await this.camionRepository.save(camion);
    return { message: `Camion #${id} activated successfully` };
  }

  // ✅ Désactiver
  async deactivate(id: number): Promise<any> {
    const camion = await this.camionRepository.findOne({ where: { id } });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);
    if (!camion.isActive) return { message: `Camion #${id} is already inactive` };
    camion.isActive = false;
    await this.camionRepository.save(camion);
    return { message: `Camion #${id} deactivated successfully` };
  }

  // ✅ Supprimer
  async remove(id: number): Promise<any> {
    const camion = await this.camionRepository.findOne({ where: { id } });
    if (!camion) throw new NotFoundException(`Camion #${id} not found`);
    await this.camionRepository.delete(id);
    return { message: `Camion #${id} deleted successfully` };
  }

  // ✅ Camions disponibles (pour assignation à une mission)
  async findAvailable(): Promise<any> {
    const camions = await this.camionRepository.find({
      where: { status: CamionStatus.AVAILABLE, isActive: true },
      relations: ['driver'],
    });
    return {
      total: camions.length,
      camions: camions.map((c) => this.sanitize(c)),
    };
  }

  // 🔒 Helper
  private sanitize(camion: Camion, withDates = false) {
    return {
      id: camion.id,
      matricule: camion.matricule,
      marque: camion.marque,
      modele: camion.modele,
      annee: camion.annee,
      type: camion.type,
      status: camion.status,
      capaciteTonnage: camion.capaciteTonnage,
      couleur: camion.couleur,
      numeroSerie: camion.numeroSerie,
      assuranceExpiry: camion.assuranceExpiry,
      visite_technique_expiry: camion.visite_technique_expiry,
      photo: camion.photo,
      isActive: camion.isActive,
      driver: camion.driver ? {
        id: camion.driver.id,
        email: camion.driver.email,
        firstName: camion.driver.firstName,
        lastName: camion.driver.lastName,
        phone: camion.driver.phone,
      } : null,
      ...(withDates && {
        createdAt: camion.createdAt,
        updatedAt: camion.updatedAt,
      }),
    };
  }

  async getStats(): Promise<any> {
  const total = await this.camionRepository.count();
  const available = await this.camionRepository.count({
    where: { status: CamionStatus.AVAILABLE, isActive: true },
  });
  const inMission = await this.camionRepository.count({
    where: { status: CamionStatus.IN_MISSION },
  });
  const maintenance = await this.camionRepository.count({
    where: { status: CamionStatus.MAINTENANCE },
  });
  const outOfService = await this.camionRepository.count({
    where: { status: CamionStatus.OUT_OF_SERVICE },
  });
  const inactive = await this.camionRepository.count({
    where: { isActive: false },
  });

  return {
    total,
    available,
    inMission,
    maintenance,
    outOfService,
    inactive,
  };
}

// ✅ Driver voit son propre camion
async findByDriver(driverId: number): Promise<any> {
  const camion = await this.camionRepository.findOne({
    where: { driverId, isActive: true },
    relations: ['driver'],
  });
  if (!camion) throw new NotFoundException('No camion assigned to you');
  return this.sanitize(camion, true);
}
}