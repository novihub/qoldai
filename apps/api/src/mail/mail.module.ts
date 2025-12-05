import { Global, Module } from '@nestjs/common';
import { MailService } from './mail.service';
import { EmailChannelService } from './email-channel.service';
import { EmailChannelController } from './email-channel.controller';

@Global()
@Module({
  controllers: [EmailChannelController],
  providers: [MailService, EmailChannelService],
  exports: [MailService, EmailChannelService],
})
export class MailModule {}
