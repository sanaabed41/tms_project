import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FactureController } from './facture.controller';
import { FactureService } from './facture.service';
import { Facture } from './facture.entity';
import { BonLivraison } from '../bon-livraison/bon-livraison.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Facture, BonLivraison])],
  controllers: [FactureController],
  providers: [FactureService],
  exports: [FactureService],
})
export class FactureModule {}