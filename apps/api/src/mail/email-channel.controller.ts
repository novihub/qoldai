import { Controller, Post, Body, UseGuards, HttpCode, HttpStatus } from '@nestjs/common';
import { EmailChannelService } from './email-channel.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { IsEmail, IsString, IsNotEmpty } from 'class-validator';

class TestEmailDto {
  @IsEmail()
  from: string;

  @IsString()
  @IsNotEmpty()
  subject: string;

  @IsString()
  @IsNotEmpty()
  body: string;
}

@Controller('email')
export class EmailChannelController {
  constructor(private readonly emailChannelService: EmailChannelService) {}

  /**
   * Manually trigger email check (for testing/debugging)
   * TODO: Add auth guard in production
   */
  @Post('check')
  @HttpCode(HttpStatus.OK)
  async triggerEmailCheck() {
    const result = await this.emailChannelService.triggerEmailCheck();
    return {
      success: true,
      message: `Processed ${result.processed} emails`,
      ...result,
    };
  }

  /**
   * Simulate receiving an email (for testing without IMAP)
   */
  @Post('test')
  @HttpCode(HttpStatus.OK)
  async testEmailReceive(@Body() dto: TestEmailDto) {
    const result = await this.emailChannelService.simulateEmailReceive(
      dto.from,
      dto.subject,
      dto.body,
    );
    return {
      success: true,
      message: 'Test email processed',
      ...result,
    };
  }
}
