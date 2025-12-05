import { IsString, IsNotEmpty, IsArray, IsOptional, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class MessageDto {
  @IsString()
  @IsOptional()
  id?: string;

  @IsString()
  role: 'user' | 'assistant' | 'system';

  @IsString()
  content: string;

  @IsOptional()
  createdAt?: Date;

  @IsString()
  @IsOptional()
  imageUrl?: string;
}

export class ChatRequestDto {
  @IsString()
  @IsNotEmpty()
  message: string;

  @IsArray()
  @IsOptional()
  @ValidateNested({ each: true })
  @Type(() => MessageDto)
  history?: MessageDto[];

  @IsString()
  @IsOptional()
  imageBase64?: string;
}

export class VisionRequestDto {
  @IsString()
  @IsNotEmpty()
  prompt: string;

  @IsString()
  @IsNotEmpty()
  imageBase64: string;
}

export class SetSystemPromptDto {
  @IsString()
  @IsNotEmpty()
  role: string;

  @IsString()
  @IsOptional()
  customPrompt?: string;
}
