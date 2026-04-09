import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { User } from '../users/user.entity';

@Entity()
export class Company {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  nom: string;

  @Column()
  adresse: string;

  @Column()
  ville: string;

  @Column({ default: 'Tunisie' })
  pays: string;

  @Column({ unique: true })
  email: string;

  @Column()
  telephone: string;

  @Column({ nullable: true })
  siteWeb: string;

  @Column({ nullable: true, unique: true })
  RC: string; // Registre de Commerce

  @Column({ nullable: true, unique: true })
  TVA: string; // Numéro TVA

  @Column({ nullable: true })
  logo: string; // URL logo

  @Column({ default: true })
  isActive: boolean;

  // Code unique pour l'auto-inscription des clients
  @Column({ unique: true, nullable: true })
  companyCode: string;

  // 🔗 Contacts (Users avec role CLIENT)
  @OneToMany(() => User, (user) => user.company)
  contacts: User[];

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}