import {
  Controller,
  Post,
  Body,
  HttpCode,
  Logger,
  Headers,
} from '@nestjs/common';
import { TelephonyService } from './telephony.service';

/**
 * Webhook контроллер на корневом URL для Kcell VPBX
 * Kcell отправляет запросы на корень с Content-Type: application/x-www-form-urlencoded
 */
@Controller()
export class KcellWebhookController {
  private readonly logger = new Logger(KcellWebhookController.name);

  constructor(private readonly telephonyService: TelephonyService) {}

  @Post()
  @HttpCode(200)
  async handleRootWebhook(
    @Body() body: any,
    @Headers('X-API-KEY') apiKey?: string,
  ) {
    this.logger.log(`  ========== KCELL WEBHOOK (ROOT) ==========`);
    this.logger.log(`  X-API-KEY: ${apiKey}`);
    this.logger.log(`  Body: ${JSON.stringify(body)}`);
    this.logger.log(`  cmd: ${body.cmd}`);

    try {
      switch (body.cmd) {
        case 'event':
          this.logger.log(`  Processing EVENT`);
          // Преобразуем form data в DTO формат
          return this.telephonyService.handleEvent({
            cmd: 'event',
            type: body.type?.toUpperCase() || 'INCOMING',
            callid: body.callid,
            phone: body.phone,
            user: body.user,
            direction: body.direction || body.type, // 'in' или 'out'
            diversion: body.diversion,
            ext: body.ext,
            groupRealName: body.groupRealName,
            second_callid: body.second_callid,
            crm_token: body.crm_token,
          });

        case 'history':
          this.logger.log(`  Processing HISTORY`);
          return this.telephonyService.handleHistory({
            cmd: 'history',
            callid: body.callid,
            phone: body.phone,
            type: body.type,
            user: body.user,
            diversion: body.diversion,
            start: body.start,
            duration: body.duration || '0',
            status: body.status,
            link: body.link,
            crm_token: body.crm_token,
          });

        case 'contact':
          this.logger.log(`  Processing CONTACT`);
          return this.telephonyService.handleContact({
            cmd: 'contact',
            callid: body.callid,
            phone: body.phone,
            diversion: body.diversion,
            crm_token: body.crm_token,
          });

        case 'rating':
          this.logger.log(`⭐ Processing RATING`);
          return this.telephonyService.handleRating({
            cmd: 'rating',
            callid: body.callid,
            rating: body.rating ? parseInt(body.rating) : 0,
            crm_token: body.crm_token,
          });

        default:
          this.logger.warn(` ️ Unknown cmd: ${body.cmd}`);
          return { success: true, message: 'Unknown command' };
      }
    } catch (error) {
      this.logger.error(`  Error processing webhook: ${error.message}`);
      this.logger.error(error.stack);
      // Возвращаем success чтобы Kcell не пытался повторно отправить
      return { success: false, error: error.message };
    }
  }
}
