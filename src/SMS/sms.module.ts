import { Module } from '@nestjs/common';
import { SmsService } from './sms.service';
import { SmsController } from './sms.controller';
import { ConfigModule } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';

@Module({
  imports: [ConfigModule],
  controllers: [SmsController],
  providers: [SmsService, PrismaService],
  exports: [SmsService],
})
export class SmsModule {}