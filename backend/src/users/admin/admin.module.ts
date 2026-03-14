import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { UsersModule } from '../../users/users.module';
import { AuthModule } from '../../auth/auth.module';
import { User } from '../../users/user.entity';

@Module({
  imports: [
    UsersModule,
    AuthModule,
    TypeOrmModule.forFeature([User]), // ✅ pour QueryBuilder
  ],
  controllers: [AdminController],
  providers: [AdminService],
})
export class AdminModule {}