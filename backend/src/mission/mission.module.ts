import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { MissionController } from './mission.controller';
import { MissionService } from './mission.service';
import { Mission } from './mission.entity';
import { Company } from '../company/company.entity'; 

@Module({
  imports: [TypeOrmModule.forFeature([Mission, Company])], 
  controllers: [MissionController],
  providers: [MissionService],
  exports: [MissionService],
})
export class MissionModule {}