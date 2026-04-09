/**
 * SEED SCRIPT — Comptes de test TMS Pro
 * Usage: npx ts-node src/seed/seed.ts
 *
 * Crée :
 *  - 1 entreprise de test (TransLog TN)
 *  - 1 ADMIN  (sanaadmin@gmail.com / sana)
 *  - 1 DISPATCHER (sanadispatcher@gmail.com / sana)
 *  - 1 ACCOUNTANT (sanaaccountant@gmail.com / sana)
 *  - 1 DRIVER (sanadriver@gmail.com / sana)
 *  - 1 CLIENT (sanaclient@gmail.com / sana)
 */

import 'reflect-metadata';
import { DataSource } from 'typeorm';
import * as bcrypt from 'bcrypt';

// ── Entities (import direct sans les modules NestJS) ─────────────────────────
import { Company } from '../company/company.entity';
import { User } from '../users/user.entity';
import { UserRole } from '../users/enums/user-role.enum';

const AppDataSource = new DataSource({
  type: 'postgres',
  host: 'localhost',
  port: 5432,
  username: 'postgres',
  password: 'sana',
  database: 'tms_db',
  entities: [Company, User],
  synchronize: false,
  logging: false,
});

const COMPANY_CODE = 'TRANSLOG1';

const USERS: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: UserRole;
}[] = [
  { email: 'sanaadmin@gmail.com', password: 'sana', firstName: 'Sana', lastName: 'Admin', phone: '0551000001', role: UserRole.ADMIN },
  { email: 'sanadispatcher@gmail.com', password: 'sana', firstName: 'Sana', lastName: 'Dispatcher', phone: '0551000002', role: UserRole.DISPATCHER },
  { email: 'sanaaccountant@gmail.com', password: 'sana', firstName: 'Sana', lastName: 'Accountant', phone: '0551000003', role: UserRole.ACCOUNTANT },
  { email: 'sanadriver@gmail.com', password: 'sana', firstName: 'Sana', lastName: 'Driver', phone: '0551000004', role: UserRole.DRIVER },
  { email: 'sanaclient@gmail.com', password: 'sana', firstName: 'Sana', lastName: 'Client', phone: '0551000005', role: UserRole.CLIENT },
];

async function seed() {
  await AppDataSource.initialize();
  console.log('✅ Connected to database');

  const companyRepo = AppDataSource.getRepository(Company);
  const userRepo = AppDataSource.getRepository(User);

  // ── Créer l'entreprise ──────────────────────────────────────────────────
  let company = await companyRepo.findOne({ where: { email: 'contact@translog.tn' } });

  if (!company) {
    company = companyRepo.create({
      nom: 'TransLog TN',
      adresse: '12 Rue des Transporteurs',
      ville: 'Tunis',
      pays: 'Tunisie',
      email: 'contact@translog.tn',
      telephone: '71000000',
      siteWeb: 'https://translog.tn',
      RC: 'RC-2024-TEST',
      TVA: 'TVA-2024-TEST',
      companyCode: COMPANY_CODE,
      isActive: true,
    });
    company = await companyRepo.save(company);
    console.log(`✅ Entreprise créée : ${company.nom} (code: ${COMPANY_CODE})`);
  } else {
    console.log(`ℹ️  Entreprise déjà existante : ${company.nom}`);
    // S'assurer que le companyCode est défini
    if (!company.companyCode) {
      company.companyCode = COMPANY_CODE;
      await companyRepo.save(company);
    }
  }

  // ── Créer les utilisateurs ─────────────────────────────────────────────
  for (const u of USERS) {
    const existing = await userRepo.findOne({ where: { email: u.email } });
    if (existing) {
      console.log(`ℹ️  Compte déjà existant : ${u.email} (${u.role})`);
      continue;
    }

    const hashed = await bcrypt.hash(u.password, 10);
    const user = userRepo.create({
      email: u.email,
      password: hashed,
      firstName: u.firstName,
      lastName: u.lastName,
      phone: u.phone,
      role: u.role,
      companyId: company.id,
      isEmailVerified: true,
      isActive: true,
    });
    await userRepo.save(user);
    console.log(`✅ Créé : ${u.email} (${u.role}) — mdp: ${u.password}`);
  }

  await AppDataSource.destroy();
  console.log('\n🎉 Seed terminé ! Récapitulatif des comptes de test :');
  console.log('─────────────────────────────────────────────────────────');
  console.log('Rôle        | Email                      | Mot de passe');
  console.log('─────────────────────────────────────────────────────────');
  for (const u of USERS) {
    console.log(`${u.role.padEnd(12)}| ${u.email.padEnd(27)}| ${u.password}`);
  }
  console.log('─────────────────────────────────────────────────────────');
  console.log(`Code entreprise client : ${COMPANY_CODE}`);
}

seed().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
