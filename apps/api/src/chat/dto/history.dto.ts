import { IsString, IsOptional, IsArray, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

export class CreateChatDto {
  @IsString()
  @IsOptional()
  title?: string;

  @IsString()
  @IsOptional()
  role?: string;
}

export class CreateMessageDto {
  @IsString()
  chatId: string;

  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class ChatWithMessagesDto {
  id: string;
  title: string | null;
  role: string;
  createdAt: Date;
  messages: {
    id: string;
    role: string;
    content: string;
    imageUrl: string | null;
    createdAt: Date;
  }[];
}
