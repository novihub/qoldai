import { Controller, Post, Body, UseGuards, Req, Get, Put, Param, Delete } from '@nestjs/common';
import { ChatService } from './chat.service';
import { ChatRequestDto, VisionRequestDto, SetSystemPromptDto } from './dto/chat.dto';
import { CreateChatDto, CreateMessageDto } from './dto/history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(private chatService: ChatService) {}

  @Post()
  chat(@Body() dto: ChatRequestDto, @Req() req: any) {
    return this.chatService.chat(dto, req.user.id);
  }

  @Post('vision')
  vision(@Body() dto: VisionRequestDto, @Req() req: any) {
    return this.chatService.analyzeImage(dto, req.user.id);
  }

  // Получить текущий system prompt и доступные роли
  @Get('system-prompt')
  getSystemPrompt() {
    return this.chatService.getSystemPrompt();
  }

  // Сменить роль ассистента
  @Put('system-prompt')
  setSystemPrompt(@Body() dto: SetSystemPromptDto) {
    return this.chatService.setSystemPrompt(dto.role, dto.customPrompt);
  }

  // ============ CHAT HISTORY ENDPOINTS ============

  // Создать новый чат
  @Post('history')
  createChat(@Body() dto: CreateChatDto, @Req() req: any) {
    return this.chatService.createChat(req.user.id, dto);
  }

  // Получить все чаты пользователя
  @Get('history')
  getUserChats(@Req() req: any) {
    return this.chatService.getUserChats(req.user.id);
  }

  // Получить чат с сообщениями
  @Get('history/:chatId')
  getChatWithMessages(@Param('chatId') chatId: string, @Req() req: any) {
    return this.chatService.getChatWithMessages(chatId, req.user.id);
  }

  // Добавить сообщение в чат
  @Post('history/:chatId/messages')
  addMessage(@Param('chatId') chatId: string, @Body() dto: Omit<CreateMessageDto, 'chatId'>, @Req() req: any) {
    return this.chatService.addMessage({ ...dto, chatId } as CreateMessageDto, req.user.id);
  }

  // Удалить чат
  @Delete('history/:chatId')
  deleteChat(@Param('chatId') chatId: string, @Req() req: any) {
    return this.chatService.deleteChat(chatId, req.user.id);
  }

  // Обновить название чата
  @Put('history/:chatId')
  updateChatTitle(@Param('chatId') chatId: string, @Body('title') title: string, @Req() req: any) {
    return this.chatService.updateChatTitle(chatId, title, req.user.id);
  }
}
