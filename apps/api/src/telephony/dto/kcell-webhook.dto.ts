import { IsString, IsOptional, IsNumber } from 'class-validator';

// Типы команд webhook от Kcell VPBX
export type KcellWebhookCmd = 'event' | 'history' | 'contact' | 'rating';

// Типы событий звонка
export type KcellEventType = 
  | 'INCOMING'    // Входящий звонок
  | 'ACCEPTED'    // Звонок принят
  | 'COMPLETED'   // Звонок завершён
  | 'CANCELLED'   // Звонок отменён
  | 'OUTGOING'    // Исходящий звонок
  | 'TRANSFERRED'; // Звонок переведён

// Статусы из history
export type KcellHistoryStatus = 
  | 'Success' 
  | 'Missed' 
  | 'Cancel' 
  | 'Busy' 
  | 'NotAvailable' 
  | 'NotAllowed' 
  | 'NotFound';

// Event - события звонка (INCOMING, ACCEPTED, COMPLETED, etc.)
export class KcellEventDto {
  @IsString()
  cmd: 'event' = 'event';

  @IsString()
  crm_token: string;

  @IsString()
  type: KcellEventType;

  @IsString()
  callid: string;

  @IsString()
  phone: string;

  @IsString()
  user: string; // ID пользователя ВАТС

  @IsString()
  direction: 'in' | 'out';

  @IsString()
  @IsOptional()
  diversion?: string; // номер ВАТС

  @IsString()
  @IsOptional()
  groupRealName?: string; // название отдела

  @IsString()
  @IsOptional()
  ext?: string; // внутренний номер

  @IsString()
  @IsOptional()
  telnum?: string; // прямой номер

  @IsString()
  @IsOptional()
  second_callid?: string; // ID переведенного звонка
}

// History - история звонка со ссылкой на запись
export class KcellHistoryDto {
  @IsString()
  cmd: 'history' = 'history';

  @IsString()
  crm_token: string;

  @IsString()
  type: 'in' | 'out';

  @IsString()
  user: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  diversion?: string;

  @IsString()
  start: string; // формат YYYYmmddTHHMMSSZ

  @IsString()
  duration: string; // секунды

  @IsString()
  callid: string;

  @IsString()
  status: KcellHistoryStatus;

  @IsString()
  @IsOptional()
  link?: string; // ссылка на запись

  @IsNumber()
  @IsOptional()
  rating?: number;
}

// Contact - запрос информации о клиенте
export class KcellContactDto {
  @IsString()
  cmd: 'contact' = 'contact';

  @IsString()
  crm_token: string;

  @IsString()
  phone: string;

  @IsString()
  @IsOptional()
  diversion?: string;

  @IsString()
  callid: string;
}

// Rating - оценка качества от клиента
export class KcellRatingDto {
  @IsString()
  cmd: 'rating' = 'rating';

  @IsString()
  crm_token: string;

  @IsString()
  callid: string;

  @IsNumber()
  rating: number;
}

// Ответ на contact запрос
export interface KcellContactResponseDto {
  contact_name: string;
  responsible?: string | null; // на кого перевести
}

// DTO для исходящего звонка
export class MakeCallDto {
  @IsString()
  phone: string;

  @IsString()
  user: string; // ID пользователя ВАТС
}

// Ответ на makeCall
export class MakeCallResponseDto {
  callid: string;
}

// Общий тип для входящего webhook
export type KcellWebhookPayload = 
  | KcellEventDto 
  | KcellHistoryDto 
  | KcellContactDto 
  | KcellRatingDto;
