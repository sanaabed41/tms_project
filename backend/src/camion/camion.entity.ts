import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { CamionStatus } from './enums/camion-status.enum';
import { CamionType } from './enums/camion-type.enum';
import { User } from '../users/user.entity';

@Entity()
export class Camion {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  matricule: string; // plaque d'immatriculation

  @Column()
  marque: string; // Mercedes, Volvo, MAN...

  @Column()
  modele: string;

  @Column()
  annee: number;

  @Column({
    type: 'enum',
    enum: CamionType,
    default: CamionType.FLATBED,
  })
  type: CamionType;

  @Column({
    type: 'enum',
    enum: CamionStatus,
    default: CamionStatus.AVAILABLE,
  })
  status: CamionStatus;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  capaciteTonnage: number; // capacité en tonnes

  @Column({ nullable: true })
  couleur: string;

  @Column({ nullable: true })
  numeroSerie: string;

  @Column({ nullable: true })
  assuranceExpiry: Date; // date expiration assurance

  @Column({ nullable: true })
  visite_technique_expiry: Date; // date expiration visite technique

  @Column({ nullable: true })
  photo: string; // URL photo

  @Column({ default: true })
  isActive: boolean;

  // 🔗 Relation avec le driver assigné (optionnel)
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;
  
@Column({ nullable: true, type: 'int' })
driverId: number | null; // ✅ accepte null

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}