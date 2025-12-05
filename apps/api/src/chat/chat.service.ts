import { Injectable, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Chat, Message } from '@prisma/client';
import { ChatRequestDto, VisionRequestDto } from './dto/chat.dto';
import { CreateChatDto, CreateMessageDto } from './dto/history.dto';
import { PrismaService } from '../prisma/prisma.service';

export const SYSTEM_PROMPTS: Record<string, { name: string; prompt: string }> = {
  default: {
    name: 'Универсальный ассистент',
    prompt: 'You are a helpful assistant. Answer questions clearly and concisely in the same language as the user.',
  },
  medical: {
    name: 'Медицинский консультант',
    prompt: 'You are a medical consultant AI. Provide helpful health information, but always remind users to consult real doctors for medical decisions. Be empathetic and professional. Answer in Russian.',
  },
  legal: {
    name: 'Юридический помощник',
    prompt: 'You are a legal assistant AI. Help users understand legal concepts and procedures. Always clarify that you provide general information, not legal advice, and recommend consulting a licensed attorney. Answer in Russian.',
  },
  hr: {
    name: 'HR-ассистент',
    prompt: 'You are an HR assistant AI. Help with job descriptions, interview questions, employee policies, and workplace culture advice. Be professional and supportive. Answer in Russian.',
  },
  teacher: {
    name: 'Преподаватель',
    prompt: 'You are a patient and encouraging teacher AI. Explain concepts clearly, use examples, and adapt to the student learning pace. Ask questions to check understanding. Answer in Russian.',
  },
  coder: {
    name: 'Программист',
    prompt: 'You are an expert programmer AI. Write clean, well-documented code. Explain your solutions and suggest best practices. Support all popular programming languages.',
  },
  writer: {
    name: 'Писатель',
    prompt: 'You are a creative writing assistant. Help with stories, articles, marketing copy, and editing. Adapt your tone to the requested style. Answer in Russian.',
  },
  analyst: {
    name: 'Бизнес-аналитик',
    prompt: 'You are a business analyst AI. Help analyze data, create reports, and provide insights. Be data-driven and practical. Answer in Russian.',
  },
};

@Injectable()
export class ChatService {
  // Текущий активный system prompt (можно менять в runtime)
  private currentSystemPrompt: string;
  private currentRole: string = 'default';

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    // Инициализация из .env или default
    const envPrompt = this.configService.get('SYSTEM_PROMPT');
    const envRole = this.configService.get('DEFAULT_ROLE', 'default');
    
    if (envPrompt) {
      this.currentSystemPrompt = envPrompt;
      this.currentRole = 'custom';
    } else {
      this.currentRole = envRole;
      this.currentSystemPrompt = SYSTEM_PROMPTS[envRole]?.prompt || SYSTEM_PROMPTS.default.prompt;
    }
  }

  // Получить текущий system prompt
  getSystemPrompt() {
    return {
      role: this.currentRole,
      prompt: this.currentSystemPrompt,
      availableRoles: Object.entries(SYSTEM_PROMPTS).map(([key, val]) => ({
        id: key,
        name: val.name,
      })),
    };
  }

  // Сменить роль (system prompt)
  setSystemPrompt(role: string, customPrompt?: string) {
    if (customPrompt) {
      this.currentRole = 'custom';
      this.currentSystemPrompt = customPrompt;
    } else if (SYSTEM_PROMPTS[role]) {
      this.currentRole = role;
      this.currentSystemPrompt = SYSTEM_PROMPTS[role].prompt;
    } else {
      throw new Error(`Unknown role: ${role}`);
    }

    return this.getSystemPrompt();
  }

  async chat(dto: ChatRequestDto, userId: string) {
    // AI Provider stub - replace with actual implementation
    // Supported providers: OpenAI, Claude, Groq, etc.
    
    const aiProvider = this.configService.get('AI_PROVIDER', 'stub');
    
    let response: string;

    // If image is attached, use vision
    if (dto.imageBase64) {
      response = await this.callOpenAIVision(dto.message, dto.imageBase64);
    } else {
      switch (aiProvider) {
        case 'openai':
          response = await this.callOpenAI(dto);
          break;
        case 'claude':
          response = await this.callClaude(dto);
          break;
        case 'groq':
          response = await this.callGroq(dto);
          break;
        default:
          // Stub response for development
          response = this.getStubResponse(dto.message);
      }
    }

    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: response,
        createdAt: new Date(),
      },
    };
  }

  // Analyze image with GPT-4o Vision
  async analyzeImage(dto: VisionRequestDto, userId: string) {
    const response = await this.callOpenAIVision(dto.prompt, dto.imageBase64);
    
    return {
      message: {
        id: crypto.randomUUID(),
        role: 'assistant' as const,
        content: response,
        createdAt: new Date(),
      },
    };
  }

  // GPT-4o Vision implementation
  private async callOpenAIVision(prompt: string, imageBase64: string): Promise<string> {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      return 'OpenAI API key not configured. Set OPENAI_API_KEY in .env';
    }

    try {
      // Ensure proper base64 format
      const imageUrl = imageBase64.startsWith('data:') 
        ? imageBase64 
        : `data:image/jpeg;base64,${imageBase64}`;

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { 
                  type: 'image_url', 
                  image_url: { 
                    url: imageUrl,
                    detail: 'auto'
                  } 
                },
              ],
            },
          ],
          max_tokens: 1000,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI Vision API error');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      return `Vision Error: ${error.message}`;
    }
  }

  private getStubResponse(message: string): string {
    // Stub responses for development/testing
    const responses = [
      `This is a stub response to: "${message}". Connect an AI provider to get real responses.`,
      `I received your message: "${message}". Configure AI_PROVIDER in .env to enable real AI.`,
      `[Stub Mode] Your message was: "${message}". Set AI_PROVIDER=openai|claude|groq to activate.`,
    ];
    return responses[Math.floor(Math.random() * responses.length)];
  }

  // OpenAI implementation
  private async callOpenAI(dto: ChatRequestDto): Promise<string> {
    const apiKey = this.configService.get('OPENAI_API_KEY');
    
    if (!apiKey) {
      return 'OpenAI API key not configured. Set OPENAI_API_KEY in .env';
    }

    try {
      const messages = [
        { role: 'system', content: this.currentSystemPrompt },
        ...(dto.history || []).map((msg) => ({
          role: msg.role,
          content: msg.content,
        })),
        { role: 'user', content: dto.message },
      ];

      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error?.message || 'OpenAI API error');
      }

      const data = await response.json();
      return data.choices[0].message.content;
    } catch (error: any) {
      return `OpenAI Error: ${error.message}`;
    }
  }

  // Claude implementation placeholder
  private async callClaude(dto: ChatRequestDto): Promise<string> {
    const apiKey = this.configService.get('ANTHROPIC_API_KEY');
    
    if (!apiKey) {
      return 'Anthropic API key not configured. Set ANTHROPIC_API_KEY in .env';
    }

    // TODO: Implement Claude API call
    // const response = await fetch('https://api.anthropic.com/v1/messages', {
    //   method: 'POST',
    //   headers: {
    //     'x-api-key': apiKey,
    //     'anthropic-version': '2023-06-01',
    //     'Content-Type': 'application/json',
    //   },
    //   body: JSON.stringify({
    //     model: 'claude-sonnet-4-20250514',
    //     max_tokens: 1024,
    //     messages: [
    //       ...(dto.history || []),
    //       { role: 'user', content: dto.message },
    //     ],
    //   }),
    // });
    // const data = await response.json();
    // return data.content[0].text;

    return `[Claude Placeholder] Implement API call for: ${dto.message}`;
  }

  // Groq implementation placeholder
  private async callGroq(dto: ChatRequestDto): Promise<string> {
    const apiKey = this.configService.get('GROQ_API_KEY');
    
    if (!apiKey) {
      return 'Groq API key not configured. Set GROQ_API_KEY in .env';
    }

    // TODO: Implement Groq API call
    return `[Groq Placeholder] Implement API call for: ${dto.message}`;
  }

  // ============ CHAT HISTORY METHODS ============

  // Создать новый чат
  async createChat(userId: string, dto: CreateChatDto) {
    const chat = await this.prisma.chat.create({
      data: {
        userId,
        title: dto.title,
        role: dto.role || this.currentRole,
      },
    });
    return chat;
  }

  // Получить все чаты пользователя
  async getUserChats(userId: string) {
    const chats = await this.prisma.chat.findMany({
      where: { userId },
      orderBy: { updatedAt: 'desc' },
      include: {
        messages: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    return chats.map((chat: Chat & { messages: Message[] }) => ({
      id: chat.id,
      title: chat.title || chat.messages[0]?.content?.slice(0, 50) || 'Новый чат',
      role: chat.role,
      createdAt: chat.createdAt,
      updatedAt: chat.updatedAt,
      lastMessage: chat.messages[0]?.content?.slice(0, 100),
    }));
  }

  // Получить чат с сообщениями
  async getChatWithMessages(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
        },
      },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return chat;
  }

  // Добавить сообщение в чат
  async addMessage(dto: CreateMessageDto, userId: string) {
    // Проверить что чат принадлежит пользователю
    const chat = await this.prisma.chat.findFirst({
      where: { id: dto.chatId, userId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    const message = await this.prisma.message.create({
      data: {
        chatId: dto.chatId,
        role: dto.role,
        content: dto.content,
        imageUrl: dto.imageUrl,
      },
    });

    // Обновить updatedAt чата
    await this.prisma.chat.update({
      where: { id: dto.chatId },
      data: { updatedAt: new Date() },
    });

    return message;
  }

  // Удалить чат
  async deleteChat(chatId: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    await this.prisma.chat.delete({
      where: { id: chatId },
    });

    return { success: true };
  }

  // Обновить название чата
  async updateChatTitle(chatId: string, title: string, userId: string) {
    const chat = await this.prisma.chat.findFirst({
      where: { id: chatId, userId },
    });

    if (!chat) {
      throw new NotFoundException('Chat not found');
    }

    return this.prisma.chat.update({
      where: { id: chatId },
      data: { title },
    });
  }
}
