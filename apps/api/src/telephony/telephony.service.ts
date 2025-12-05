import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import {
  KcellEventDto,
  KcellHistoryDto,
  KcellContactDto,
  KcellRatingDto,
  KcellContactResponseDto,
  MakeCallDto,
  KcellEventType,
  KcellHistoryStatus,
} from './dto/kcell-webhook.dto';

@Injectable()
export class TelephonyService {
  private readonly logger = new Logger(TelephonyService.name);
  private readonly apiUrl: string;
  private readonly apiKey: string;

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
  ) {
    this.apiUrl = this.config.get('KCELL_VPBX_URL') || 'https://kurbanova.vpbx.kcell.kz';
    this.apiKey = this.config.get('KCELL_VPBX_API_KEY') || '';
    
    if (this.apiKey) {
      this.logger.log(`  Kcell VPBX configured: ${this.apiUrl}`);
    } else {
      this.logger.warn('  Kcell VPBX API key not configured');
    }
  }

  /**
   * Обработка event webhook (INCOMING, ACCEPTED, COMPLETED, etc.)
   */
  async handleEvent(dto: KcellEventDto) {
    this.logger.log(`  ========== EVENT RECEIVED ==========`);
    this.logger.log(`  Type: ${dto.type}`);
    this.logger.log(`  CallID: ${dto.callid}`);
    this.logger.log(`  Phone: ${dto.phone}`);
    this.logger.log(`  Direction: ${dto.direction}`);
    this.logger.log(`  User: ${dto.user}`);
    this.logger.log(`  Diversion: ${dto.diversion}`);
    this.logger.log(`  Group: ${dto.groupRealName}`);
    this.logger.log(`  Full DTO: ${JSON.stringify(dto)}`);

    const statusMap: Record<KcellEventType, string> = {
      INCOMING: 'INCOMING',
      OUTGOING: 'OUTGOING',
      ACCEPTED: 'ACCEPTED',
      COMPLETED: 'COMPLETED',
      CANCELLED: 'CANCELLED',
      TRANSFERRED: 'TRANSFERRED',
    };

    const status = statusMap[dto.type] || 'INCOMING';
    const direction = dto.direction === 'in' ? 'IN' : 'OUT';

    this.logger.log(`  Mapped status: ${status}, direction: ${direction}`);

    try {
      // Найти или создать запись звонка
      const existingCall = await this.prisma.callLog.findUnique({
        where: { callId: dto.callid },
      });

      this.logger.log(`  Existing call: ${existingCall ? 'YES' : 'NO'}`);

      if (existingCall) {
        // Обновляем статус
        const updateData: any = { status };
        
        if (dto.type === 'ACCEPTED') {
          updateData.answeredAt = new Date();
        }
        if (dto.type === 'COMPLETED' || dto.type === 'CANCELLED') {
          updateData.endedAt = new Date();
        }
        if (dto.second_callid) {
          updateData.secondCallId = dto.second_callid;
        }

        await this.prisma.callLog.update({
          where: { callId: dto.callid },
          data: updateData,
        });

        this.logger.log(`  Call ${dto.callid} updated: ${status}`);
      } else {
        // Создаем новую запись
        const newCall = await this.prisma.callLog.create({
          data: {
            callId: dto.callid,
            phone: dto.phone,
            diversion: dto.diversion,
            direction,
            status: status as any,
            userId: dto.user,
            ext: dto.ext,
            groupRealName: dto.groupRealName,
            secondCallId: dto.second_callid,
            answeredAt: dto.type === 'ACCEPTED' ? new Date() : undefined,
          },
        });

        this.logger.log(`  Call created in DB: ${newCall.id}`);

        // Для входящего звонка - можно создать тикет автоматически
        if (dto.type === 'INCOMING' && direction === 'IN') {
          this.logger.log(`  Creating ticket for incoming call...`);
          await this.createTicketFromIncomingCall(dto);
        } else {
          this.logger.log(`  Not creating ticket: type=${dto.type}, direction=${direction}`);
        }
      }
    } catch (error) {
      this.logger.error(`  Error handling event: ${error.message}`);
      this.logger.error(error.stack);
      throw error;
    }

    return { success: true };
  }

  /**
   * Обработка history webhook (запись звонка готова)
   */
  async handleHistory(dto: KcellHistoryDto) {
    this.logger.log(`  History: ${dto.callid} | Status: ${dto.status} | Duration: ${dto.duration}s`);

    const statusMap: Record<KcellHistoryStatus, string> = {
      Success: 'COMPLETED',
      Missed: 'MISSED',
      Cancel: 'CANCELLED',
      Busy: 'BUSY',
      NotAvailable: 'NOT_AVAILABLE',
      NotAllowed: 'CANCELLED',
      NotFound: 'CANCELLED',
    };

    const status = statusMap[dto.status] || 'COMPLETED';
    const duration = parseInt(dto.duration) || 0;

    // Парсим время начала
    let startedAt: Date | undefined;
    if (dto.start) {
      // Формат: YYYYmmddTHHMMSSZ -> 20251205T143000Z
      const match = dto.start.match(/(\d{4})(\d{2})(\d{2})T(\d{2})(\d{2})(\d{2})Z?/);
      if (match) {
        startedAt = new Date(`${match[1]}-${match[2]}-${match[3]}T${match[4]}:${match[5]}:${match[6]}Z`);
      }
    }

    await this.prisma.callLog.upsert({
      where: { callId: dto.callid },
      update: {
        status: status as any,
        duration,
        recordingUrl: dto.link,
        rating: dto.rating,
        endedAt: new Date(),
      },
      create: {
        callId: dto.callid,
        phone: dto.phone,
        diversion: dto.diversion,
        direction: dto.type === 'in' ? 'IN' : 'OUT',
        status: status as any,
        userId: dto.user,
        duration,
        recordingUrl: dto.link,
        rating: dto.rating,
        startedAt: startedAt || new Date(),
        endedAt: new Date(),
      },
    });

    // Если есть запись - можно запустить AI транскрибацию
    if (dto.link && status === 'COMPLETED') {
      this.logger.log(` ️ Recording available: ${dto.link}`);
      // TODO: AI transcription
    }

    // Для пропущенных - создать тикет
    if (status === 'MISSED') {
      await this.createTicketFromMissedCall(dto);
    }

    return { success: true };
  }

  /**
   * Обработка contact webhook (поиск клиента)
   */
  async handleContact(dto: KcellContactDto): Promise<KcellContactResponseDto> {
    this.logger.log(`  Contact lookup: ${dto.phone}`);

    // Ищем клиента по номеру телефона в тикетах
    const recentTicket = await this.prisma.ticket.findFirst({
      where: {
        channel: 'PHONE',
        description: { contains: dto.phone },
      },
      include: {
        client: true,
        operator: true,
      },
      orderBy: { createdAt: 'desc' },
    });

    if (recentTicket?.client) {
      return {
        contact_name: recentTicket.client.name || recentTicket.client.email,
        responsible: recentTicket.operator?.name || undefined,
      };
    }

    // Если не нашли - возвращаем номер как имя
    return {
      contact_name: dto.phone,
    };
  }

  /**
   * Обработка rating webhook (оценка качества)
   */
  async handleRating(dto: KcellRatingDto) {
    this.logger.log(`⭐ Rating: ${dto.callid} = ${dto.rating}`);

    await this.prisma.callLog.update({
      where: { callId: dto.callid },
      data: { rating: dto.rating },
    });

    return { success: true };
  }

  /**
   * Совершить исходящий звонок через Kcell VPBX
   */
  async makeCall(dto: MakeCallDto): Promise<{ callid: string }> {
    if (!this.apiKey) {
      throw new HttpException('Telephony not configured', HttpStatus.SERVICE_UNAVAILABLE);
    }

    this.logger.log(`  Making call to ${dto.phone} from user ${dto.user}`);

    try {
      const response = await fetch(`${this.apiUrl}/crmapi/v1/makecall`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.apiKey,
        },
        body: JSON.stringify({
          phone: dto.phone,
          user: dto.user,
          show_phone: true,
        }),
      });

      if (!response.ok) {
        throw new Error(`Kcell API error: ${response.status}`);
      }

      const data = await response.json();
      this.logger.log(`  Call initiated: ${data.callid}`);

      return { callid: data.callid };
    } catch (error) {
      this.logger.error(`  Failed to make call: ${error.message}`);
      throw new HttpException('Failed to initiate call', HttpStatus.BAD_GATEWAY);
    }
  }

  /**
   * Получить историю звонков
   */
  async getCallLogs(params: {
    status?: string;
    direction?: string;
    phone?: string;
    limit?: number;
    offset?: number;
  }) {
    const where: any = {};

    if (params.status) where.status = params.status;
    if (params.direction) where.direction = params.direction;
    if (params.phone) where.phone = { contains: params.phone };

    const [calls, total] = await Promise.all([
      this.prisma.callLog.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        take: params.limit || 50,
        skip: params.offset || 0,
        include: {
          ticket: { select: { id: true, subject: true, status: true } },
          operator: { select: { id: true, name: true, email: true } },
        },
      }),
      this.prisma.callLog.count({ where }),
    ]);

    return { calls, total };
  }

  /**
   * Получить статистику звонков
   */
  async getCallStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [total, answered, missed, avgDuration] = await Promise.all([
      this.prisma.callLog.count({ where: { startedAt: { gte: today } } }),
      this.prisma.callLog.count({ where: { startedAt: { gte: today }, status: 'COMPLETED' } }),
      this.prisma.callLog.count({ where: { startedAt: { gte: today }, status: 'MISSED' } }),
      this.prisma.callLog.aggregate({
        where: { startedAt: { gte: today }, status: 'COMPLETED' },
        _avg: { duration: true },
      }),
    ]);

    return {
      totalCalls: total,
      answeredCalls: answered,
      missedCalls: missed,
      averageDuration: Math.round(avgDuration._avg.duration || 0),
      answerRate: total > 0 ? Math.round((answered / total) * 100) : 0,
    };
  }

  /**
   * Привязать звонок к тикету
   */
  async linkCallToTicket(callId: string, ticketId: string) {
    return this.prisma.callLog.update({
      where: { id: callId },
      data: { ticketId },
    });
  }

  /**
   * Создать тикет из входящего звонка
   */
  private async createTicketFromIncomingCall(dto: KcellEventDto) {
    this.logger.log(`  ========== CREATING TICKET ==========`);
    this.logger.log(`  Phone: ${dto.phone}`);
    
    try {
      // Находим клиента или используем дефолтного
      const client = await this.prisma.user.findFirst({
        where: { role: 'CLIENT' },
      });

      this.logger.log(`  Found client: ${client ? client.email : 'NONE'}`);

      if (!client) {
        this.logger.error(`  No CLIENT user found in database! Cannot create ticket.`);
        return;
      }

      const phone = dto.phone || 'Неизвестный номер';
      const ticket = await this.prisma.ticket.create({
        data: {
          subject: `Входящий звонок от ${phone}`,
          description: `Входящий звонок\nНомер: ${phone}\nОтдел: ${dto.groupRealName || 'Не указан'}\nВнутренний: ${dto.ext || 'Не указан'}`,
          status: 'OPEN',
          priority: 'MEDIUM',
          channel: 'PHONE',
          clientId: client.id,
        },
      });

      this.logger.log(`  Ticket created: ${ticket.id} - ${ticket.subject}`);

      // Привязываем звонок к тикету
      await this.prisma.callLog.update({
        where: { callId: dto.callid },
        data: { ticketId: ticket.id },
      });

      this.logger.log(`  Call ${dto.callid} linked to ticket ${ticket.id}`);
    } catch (error) {
      this.logger.error(`  Error creating ticket: ${error.message}`);
      this.logger.error(error.stack);
    }
  }

  /**
   * Создать тикет из пропущенного звонка
   */
  private async createTicketFromMissedCall(dto: KcellHistoryDto) {
    this.logger.log(`  ========== CREATING MISSED CALL TICKET ==========`);
    
    try {
      const client = await this.prisma.user.findFirst({
        where: { role: 'CLIENT' },
      });

      if (!client) {
        this.logger.error(`  No CLIENT user found!`);
        return;
      }

      // Проверяем что тикет ещё не создан
      const existingCall = await this.prisma.callLog.findUnique({
        where: { callId: dto.callid },
      });

      if (existingCall?.ticketId) {
        this.logger.log(`  Ticket already exists for this call`);
        return;
      }

      const ticket = await this.prisma.ticket.create({
        data: {
          subject: `  Пропущенный звонок от ${dto.phone}`,
          description: `Пропущенный звонок - требуется обратный звонок\nНомер: ${dto.phone}\nВремя: ${dto.start}`,
          status: 'OPEN',
          priority: 'HIGH',
          channel: 'PHONE',
          clientId: client.id,
        },
      });

      this.logger.log(`  Missed call ticket created: ${ticket.id}`);

      await this.prisma.callLog.update({
        where: { callId: dto.callid },
        data: { ticketId: ticket.id },
      });
    } catch (error) {
      this.logger.error(`  Error creating missed call ticket: ${error.message}`);
    }
  }
}
