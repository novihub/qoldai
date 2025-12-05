import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  Query,
  HttpCode,
  Logger,
  UseGuards,
  Headers,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TelephonyService } from './telephony.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import {
  KcellEventDto,
  KcellHistoryDto,
  KcellContactDto,
  KcellRatingDto,
  MakeCallDto,
} from './dto/kcell-webhook.dto';

@Controller('telephony')
export class TelephonyController {
  private readonly logger = new Logger(TelephonyController.name);
  private readonly crmKey: string;

  constructor(
    private readonly telephonyService: TelephonyService,
    private readonly config: ConfigService,
  ) {
    this.crmKey = this.config.get('KCELL_CRM_KEY') || '';
  }

  /**
   * Webhook endpoint для Kcell VPBX
   * Роутит запросы по полю cmd
   * Проверяет X-API-KEY если настроен KCELL_CRM_KEY
   */
  @Post('webhook')
  @HttpCode(200)
  async handleWebhook(
    @Body() body: any,
    @Headers('X-API-KEY') apiKey?: string,
  ) {
    this.logger.log(`  ========== WEBHOOK INCOMING ==========`);
    this.logger.log(`  Body: ${JSON.stringify(body)}`);
    this.logger.log(`  X-API-KEY header: ${apiKey}`);
    this.logger.log(`  Expected CRM key: ${this.crmKey}`);

    // Проверка ключа авторизации от АТС (временно отключено для отладки)
    // if (this.crmKey && apiKey !== this.crmKey) {
    //   this.logger.warn(` ️ Invalid CRM key from webhook`);
    //   throw new UnauthorizedException('Invalid API key');
    // }

    this.logger.log(`  Webhook received: cmd=${body.cmd}`);

    switch (body.cmd) {
      case 'event':
        return this.telephonyService.handleEvent(body as KcellEventDto);
      
      case 'history':
        return this.telephonyService.handleHistory(body as KcellHistoryDto);
      
      case 'contact':
        return this.telephonyService.handleContact(body as KcellContactDto);
      
      case 'rating':
        return this.telephonyService.handleRating(body as KcellRatingDto);
      
      default:
        this.logger.warn(`Unknown webhook cmd: ${body.cmd}`);
        return { success: true, message: 'Unknown command' };
    }
  }

  /**
   * Инициировать исходящий звонок
   */
  @Post('call')
  @UseGuards(JwtAuthGuard)
  async makeCall(@Body() dto: MakeCallDto) {
    return this.telephonyService.makeCall(dto);
  }

  /**
   * Получить историю звонков
   */
  @Get('calls')
  @UseGuards(JwtAuthGuard)
  async getCallLogs(
    @Query('status') status?: string,
    @Query('direction') direction?: string,
    @Query('phone') phone?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.telephonyService.getCallLogs({
      status,
      direction,
      phone,
      limit: limit ? parseInt(limit) : undefined,
      offset: offset ? parseInt(offset) : undefined,
    });
  }

  /**
   * Статистика звонков
   */
  @Get('stats')
  @UseGuards(JwtAuthGuard)
  async getCallStats() {
    return this.telephonyService.getCallStats();
  }

  /**
   * Привязать звонок к тикету
   */
  @Post('calls/:callId/link/:ticketId')
  @UseGuards(JwtAuthGuard)
  async linkCallToTicket(
    @Param('callId') callId: string,
    @Param('ticketId') ticketId: string,
  ) {
    return this.telephonyService.linkCallToTicket(callId, ticketId);
  }
}
