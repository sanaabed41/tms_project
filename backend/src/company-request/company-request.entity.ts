import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { RequestStatus } from './enums/request-status.enum';

@Entity('company_request')
export class CompanyRequest {
  @PrimaryGeneratedColumn()
  id: number;

  // ── Info entreprise ──────────────────────────────────────────────────────

  @Column()
  companyNom: string;

  @Column()
  companyAdresse: string;

  @Column()
  companyVille: string;

  @Column({ default: 'Tunisie' })
  companyPays: string;

  @Column({ unique: true })
  companyEmail: string;

  @Column()
  companyTelephone: string;

  @Column({ nullable: true })
  companySiteWeb: string;

  @Column({ nullable: true })
  companyRC: string;

  @Column({ nullable: true })
  companyTVA: string;

  @Column({ nullable: true })
  companyDescription: string;

  // ── Info admin demandeur ─────────────────────────────────────────────────

  @Column()
  adminFirstName: string;

  @Column()
  adminLastName: string;

  @Column()
  adminEmail: string;

  @Column({ nullable: true })
  adminPhone: string;

  // ── Statut de la demande ─────────────────────────────────────────────────

  @Column({ type: 'varchar', default: RequestStatus.PENDING })
  status: RequestStatus;

  @Column({ nullable: true })
  rejectReason: string;

  @Column({ nullable: true })
  reviewedAt: Date;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
