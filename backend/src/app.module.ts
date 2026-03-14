import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PassportModule } from '@nestjs/passport';
import { AuthModule } from './auth/auth.module';
import { AdminModule } from './users/admin/admin.module';
import { UsersModule } from './users/users.module';
import { CamionModule } from './camion/camion.module';
import { MissionModule } from './mission/mission.module';
@Module({
  imports: [
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
  ],
})
export class AppModule {}