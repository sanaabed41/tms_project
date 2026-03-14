import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { MissionStatus } from './enums/mission-status.enum';
import { User } from '../users/user.entity';
import { Camion } from '../camion/camion.entity';

@Entity()
export class Mission {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  reference: string; // ex: MSN-2024-001

  @Column()
  origine: string;

  @Column()
  destination: string;

  @Column()
  dateDepart: Date;

  @Column()
  dateArriveePrevu: Date;

  @Column({ nullable: true })
  dateArriveeReelle: Date; // rempli quand DELIVERED

  @Column({
    type: 'enum',
    enum: MissionStatus,
    default: MissionStatus.PENDING,
  })
  status: MissionStatus;

  @Column({ nullable: true, type: 'text' })
  description: string;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  distanceKm: number;

  @Column({ nullable: true, type: 'decimal', precision: 10, scale: 2 })
  poids: number; // poids en tonnes

  @Column({ nullable: true, type: 'text' })
  notes: string; // notes du driver

  @Column({ nullable: true, type: 'text' })
  cancelReason: string; // raison d'annulation

  // 🔗 Camion assigné
  @ManyToOne(() => Camion, { nullable: true, eager: true })
  @JoinColumn({ name: 'camionId' })
  camion: Camion;

  @Column({ nullable: true })
  camionId: number | null;

  // 🔗 Driver assigné
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ nullable: true })
  driverId: number | null;

  // 🔗 Client lié
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  clientId: number | null;

  // 🔗 Créé par
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}