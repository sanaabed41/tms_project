import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { FactureStatus, ModePaiement } from './enums/facture-status.enum';
import { BonLivraison } from '../bon-livraison/bon-livraison.entity';
import { Mission } from '../mission/mission.entity';
import { User } from '../users/user.entity';
import { Company } from '../company/company.entity';

@Entity()
export class Facture {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  reference: string; // FAC-2026-001

  @Column({
    type: 'enum',
    enum: FactureStatus,
    default: FactureStatus.DRAFT,
  })
  status: FactureStatus;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  montantHT: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, default: 19 })
  tauxTVA: number; // 19% par défaut en Tunisie

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  montantTVA: number;

  @Column({ type: 'decimal', precision: 10, scale: 3 })
  montantTTC: number;

  @Column({ nullable: true })
  dateEmission: Date;

  @Column({ nullable: true })
  dateEcheance: Date;

  @Column({ nullable: true })
  datePaiement: Date;

  @Column({
    type: 'enum',
    enum: ModePaiement,
    nullable: true,
  })
  modePaiement: ModePaiement;

  @Column({ nullable: true, type: 'text' })
  notes: string;

  @Column({ nullable: true, type: 'text' })
  cancelReason: string;

  // 🔗 Bon de Livraison
  @ManyToOne(() => BonLivraison, { nullable: true, eager: false })
  @JoinColumn({ name: 'bonLivraisonId' })
  bonLivraison: BonLivraison;

  @Column({ nullable: true })
  bonLivraisonId: number | null;

  // 🔗 Mission
  @ManyToOne(() => Mission, { nullable: true, eager: false })
  @JoinColumn({ name: 'missionId' })
  mission: Mission;

  @Column({ nullable: true })
  missionId: number | null;

  // 🔗 Client
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  clientId: number | null;

  // 🔗 Company
  @ManyToOne(() => Company, { nullable: true, eager: false })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  companyId: number | null;

  // 🔗 Créé par
  @ManyToOne(() => User, { nullable: true, eager: false })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}