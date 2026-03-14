import { CamionStatus } from '../enums/camion-status.enum';
import { CamionType } from '../enums/camion-type.enum';

export class CreateCamionDto {
  matricule: string;
  marque: string;
  modele: string;
  annee: number;
  type: CamionType;
  capaciteTonnage: number;
  couleur?: string;
  numeroSerie?: string;
  assuranceExpiry?: Date;
  visite_technique_expiry?: Date;
  photo?: string;
  driverId?: number;
  status?: CamionStatus;
}