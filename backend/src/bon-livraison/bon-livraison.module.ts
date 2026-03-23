import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BonLivraisonController } from './bon-livraison.controller';
import { BonLivraisonService } from './bon-livraison.service';
import { BonLivraison } from './bon-livraison.entity';
import { Mission } from '../mission/mission.entity';

@Module({
  imports: [TypeOrmModule.forFeature([BonLivraison, Mission])],
  controllers: [BonLivraisonController],
  providers: [BonLivraisonService],
  exports: [BonLivraisonService],
})
export class BonLivraisonModule {}