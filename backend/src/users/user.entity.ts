import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { UserRole } from './enums/user-role.enum';

@Entity()
export class User {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ unique: true })
  email: string;

  @Column()
  password: string;

    @Column({ default: '' }) 
    firstName: string;
  @Column({ nullable: true, default: '' })
lastName: string;

  @Column({ nullable: true })
  phone: string;

  @Column({ nullable: true })
  profilePicture: string;

  @Column({
  type: 'enum',
  enum: UserRole,
  enumName: 'user_role_enum', // 🔥 IMPORTANT
  default: UserRole.CLIENT,
})
role: UserRole;

@Column({ nullable: true })
address: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}