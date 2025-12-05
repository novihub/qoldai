import { Module } from '@nestjs/common';
import { TelephonyController } from './telephony.controller';
import { KcellWebhookController } from './kcell-webhook.controller';
import { TelephonyService } from './telephony.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [TelephonyController, KcellWebhookController],
  providers: [TelephonyService],
  exports: [TelephonyService],
})
export class TelephonyModule {}
