import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  OneToOne,
} from 'typeorm';
import { BonLivraisonStatus } from './enums/bon-livraison-status.enum';
import { Mission } from '../mission/mission.entity';
import { User } from '../users/user.entity';
import { Company } from '../company/company.entity';

export interface Article {
  designation: string;
  quantite: number;
  unite: string;      // kg, tonne, palette, colis...
  poids: number;
  observations?: string;
}

@Entity()
export class BonLivraison {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  reference: string; // BL-2024-001

  @Column({
    type: 'enum',
    enum: BonLivraisonStatus,
    default: BonLivraisonStatus.DRAFT,
  })
  status: BonLivraisonStatus;

  // 🔗 Mission liée
  @OneToOne(() => Mission, { nullable: true })
  @JoinColumn({ name: 'missionId' })
  mission: Mission;

  @Column({ nullable: true })
  missionId: number | null;

  // 🔗 Client
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'clientId' })
  client: User;

  @Column({ nullable: true })
  clientId: number | null;

  // 🔗 Company
  @ManyToOne(() => Company, { nullable: true, eager: true })
  @JoinColumn({ name: 'companyId' })
  company: Company;

  @Column({ nullable: true })
  companyId: number | null;

  // 🔗 Driver
  @ManyToOne(() => User, { nullable: true, eager: true })
  @JoinColumn({ name: 'driverId' })
  driver: User;

  @Column({ nullable: true })
  driverId: number | null;

  // 📦 Articles / Marchandises
  @Column({ type: 'jsonb', default: [] })
  articles: Article[];

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  poidsTotal: number;

  // 📍 Infos livraison
  @Column()
  adresseLivraison: string;

  @Column({ nullable: true })
  contactLivraison: string; // nom du réceptionnaire

  @Column({ nullable: true })
  telephoneLivraison: string;

  // ✍️ Signatures
  @Column({ nullable: true })
  signatureDriver: string; // base64 ou URL

  @Column({ nullable: true })
  dateSignatureDriver: Date;

  @Column({ nullable: true })
  signatureClient: string; // base64 ou URL

  @Column({ nullable: true })
  dateSignatureClient: Date;

  // 📸 Photo preuve livraison
  @Column({ nullable: true })
  photoPreuve: string; // URL photo

  // 📝 Observations
  @Column({ nullable: true, type: 'text' })
  observations: string;

  @Column({ nullable: true, type: 'text' })
  motifRefus: string; // si refus de signature client

  // 🔗 Créé par
  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'createdById' })
  createdBy: User;

  @Column({ nullable: true })
  createdById: number | null;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}