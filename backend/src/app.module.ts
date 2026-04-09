import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './users/admin/admin.module';
import { UsersModule } from './users/users.module';
import { CamionModule } from './camion/camion.module';
import { MissionModule } from './mission/mission.module';
import { CompanyModule } from './company/company.module';
import { BonLivraisonModule } from './bon-livraison/bon-livraison.module';
import { FactureModule } from './facture/facture.module';
import { SuperAdminModule } from './super-admin/super-admin.module';
import { CompanyRequestModule } from './company-request/company-request.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'postgres',
      password: 'sana',
      database: 'tms_db',
      autoLoadEntities: true,
      synchronize: true,
      logging: true,
    }),
  //  PassportModule.register({ defaultStrategy: 'jwt' }), // ✅ UNE SEULE fois ici
    AuthModule,
    UsersModule,
    AdminModule,
    CamionModule,
    MissionModule,
    CompanyModule,
    BonLivraisonModule,
    FactureModule,
    SuperAdminModule,
    CompanyRequestModule,
  ],
})
export class AppModule {}