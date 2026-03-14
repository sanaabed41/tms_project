import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CamionController } from './camion.controller';
import { CamionService } from './camion.service';
import { Camion } from './camion.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Camion])],
  controllers: [CamionController],
  providers: [CamionService],
  exports: [CamionService],
})
export class CamionModule {}