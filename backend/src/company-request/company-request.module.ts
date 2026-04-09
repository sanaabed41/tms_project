import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CompanyRequestController } from './company-request.controller';
import { CompanyRequestService } from './company-request.service';
import { CompanyRequest } from './company-request.entity';
import { Company } from '../company/company.entity';
import { User } from '../users/user.entity';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([CompanyRequest, Company, User]),
    MailModule,
  ],
  controllers: [CompanyRequestController],
  providers: [CompanyRequestService],
  exports: [CompanyRequestService],
})
export class CompanyRequestModule {}
