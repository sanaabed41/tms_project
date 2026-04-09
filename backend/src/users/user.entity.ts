import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { UserRole } from './enums/user-role.enum';
import { Company } from '../company/company.entity';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ unique: true })
  email!: string;

  @Column({ nullable: true })
  password!: string;

  @Column({ default: '' })
  firstName!: string;

  @Column({ nullable: true, default: '' })
  lastName!: string;

  @Column({ nullable: true })
  phone!: string;

  @Column({ nullable: true })
  profilePicture!: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    enumName: 'user_role_enum',
    default: UserRole.CLIENT,
  })
  role!: UserRole;

  @Column({ nullable: true })
  address!: string;

  @Column({ default: true })
  isActive!: boolean;

  // Email verification OTP
  @Column({ default: false })
  isEmailVerified!: boolean;

  @Column({ type: 'varchar', nullable: true })
  emailVerificationCode!: string | null;

  @Column({ type: 'timestamp', nullable: true })
  emailVerificationExpiry!: Date | null;

  // Google OAuth
  @Column({ type: 'varchar', nullable: true })
  googleId!: string | null;

  // 🔗 Company (pour les CLIENTs)
  @ManyToOne(() => Company, (company) => company.contacts, { nullable: true })
  @JoinColumn({ name: 'companyId' })
  company!: Company;

  @Column({ nullable: true })
  companyId!: number | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
