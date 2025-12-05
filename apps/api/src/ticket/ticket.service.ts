import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTicketDto, UpdateTicketDto, CreateTicketMessageDto, TicketFilterDto } from './dto/ticket.dto';
import OpenAI from 'openai';

// FAQ база - типовые вопросы с готовыми ответами
const FAQ_DATABASE = [
  {
    keywords: ['пароль', 'сбросить', 'забыл', 'восстановить', 'password', 'reset'],
    category: 'account',
    answer: {
      ru: '🔐 **Восстановление пароля**\n\nДля сброса пароля:\n1. Перейдите на страницу входа\n2. Нажмите "Забыли пароль?"\n3. Введите email и следуйте инструкциям\n\nЕсли письмо не приходит, проверьте папку "Спам".',
      kz: '🔐 **Құпия сөзді қалпына келтіру**\n\nҚұпия сөзді қалпына келтіру үшін:\n1. Кіру бетіне өтіңіз\n2. "Құпия сөзді ұмыттыңыз ба?" түймесін басыңыз\n3. Email енгізіп, нұсқауларды орындаңыз',
      en: '🔐 **Password Reset**\n\nTo reset your password:\n1. Go to the login page\n2. Click "Forgot password?"\n3. Enter your email and follow the instructions',
    },
  },
  {
    keywords: ['оплата', 'счёт', 'invoice', 'payment', 'тарив', 'подписка', 'subscription'],
    category: 'billing',
    answer: {
      ru: '💳 **Вопросы по оплате**\n\nВы можете:\n- Посмотреть счета в разделе "Биллинг"\n- Изменить способ оплаты в настройках\n- Скачать счёт-фактуру в истории платежей\n\nПри проблемах с оплатой, тикет передан специалисту.',
      kz: '💳 **Төлем сұрақтары**\n\nСіз:\n- "Биллинг" бөлімінде шоттарды көре аласыз\n- Параметрлерде төлем әдісін өзгерте аласыз\n- Төлем тарихынан шот-фактураны жүктей аласыз',
      en: '💳 **Payment Questions**\n\nYou can:\n- View invoices in the "Billing" section\n- Change payment method in settings\n- Download invoice from payment history',
    },
  },
  {
    keywords: ['не работает', 'ошибка', 'error', 'bug', 'баг', 'сломалось', 'проблема'],
    category: 'technical',
    answer: {
      ru: '🔧 **Техническая проблема**\n\nПопробуйте:\n1. Обновить страницу (Ctrl+F5)\n2. Очистить кэш браузера\n3. Попробовать другой браузер\n\nЕсли не помогло - наш специалист скоро свяжется с вами!',
      kz: '🔧 **Техникалық мәселе**\n\nКөріңіз:\n1. Бетті жаңартыңыз (Ctrl+F5)\n2. Браузер кэшін тазалаңыз\n3. Басқа браузерді қолданып көріңіз',
      en: '🔧 **Technical Issue**\n\nTry:\n1. Refresh the page (Ctrl+F5)\n2. Clear browser cache\n3. Try a different browser',
    },
  },
  {
    keywords: ['график работы', 'время работы', 'часы', 'working hours', 'support hours'],
    category: 'general',
    answer: {
      ru: '🕐 **Часы работы поддержки**\n\nМы работаем:\n- Пн-Пт: 9:00 - 18:00 (Алматы)\n- Сб-Вс: только срочные запросы\n\nAI-ассистент доступен 24/7!',
      kz: '🕐 **Қолдау жұмыс уақыты**\n\nБіз жұмыс істейміз:\n- Дс-Жм: 9:00 - 18:00 (Алматы)\n- Сс-Жс: тек шұғыл сұраулар\n\nAI көмекшісі тәулік бойы қолжетімді!',
      en: '🕐 **Support Hours**\n\nWe work:\n- Mon-Fri: 9:00 AM - 6:00 PM (Almaty)\n- Sat-Sun: urgent requests only\n\nAI assistant available 24/7!',
    },
  },
  {
    keywords: ['контакт', 'связаться', 'телефон', 'email', 'contact', 'phone'],
    category: 'general',
    answer: {
      ru: '📞 **Контакты**\n\n- Email: support@qoldai.kz\n- Телефон: +7 (727) 123-45-67\n- Telegram: @qoldai_support\n\nИли создайте тикет - мы ответим в течение 24 часов!',
      kz: '📞 **Байланыс**\n\n- Email: support@qoldai.kz\n- Телефон: +7 (727) 123-45-67\n- Telegram: @qoldai_support',
      en: '📞 **Contact Us**\n\n- Email: support@qoldai.kz\n- Phone: +7 (727) 123-45-67\n- Telegram: @qoldai_support',
    },
  },
];

@Injectable()
export class TicketService {
  private openai: OpenAI;

  constructor(private prisma: PrismaService) {
    this.openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  }

  // Check if ticket matches FAQ
  private checkFAQ(subject: string, description: string, language: string = 'RU'): { isFAQ: boolean; answer: string | null; category: string | null } {
    const text = `${subject} ${description}`.toLowerCase();
    const lang = language.toLowerCase() as 'ru' | 'kz' | 'en';
    
    for (const faq of FAQ_DATABASE) {
      const matchCount = faq.keywords.filter(keyword => text.includes(keyword.toLowerCase())).length;
      // If 2+ keywords match, it's likely a FAQ
      if (matchCount >= 2) {
        return {
          isFAQ: true,
          answer: faq.answer[lang] || faq.answer.ru,
          category: faq.category,
        };
      }
    }
    
    return { isFAQ: false, answer: null, category: null };
  }

  // AI Classification with auto-resolve detection
  async classifyTicket(subject: string, description: string) {
    const systemPrompt = `You are an AI assistant that classifies support tickets.
Analyze the ticket and respond ONLY with a JSON object in this exact format:
{
  "category": "one of: billing, technical, account, general, complaint, feature_request",
  "priority": "one of: LOW, MEDIUM, HIGH, URGENT",
  "sentiment": "one of: positive, neutral, negative",
  "language": "detected language code: RU, KZ, or EN",
  "suggestedDepartment": "suggested department name or null",
  "autoReply": "a helpful initial response to the client in their language (2-3 sentences)",
  "canAutoResolve": true/false (true if this is a simple FAQ question that can be answered without human help),
  "confidence": 0.0-1.0 (your confidence in the classification)
}`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Subject: ${subject}\n\nDescription: ${description}` }
        ],
        response_format: { type: 'json_object' },
        temperature: 0.3,
      });

      const content = response.choices[0].message.content;
      return JSON.parse(content || '{}');
    } catch (error) {
      console.error('AI Classification error:', error);
      return {
        category: 'general',
        priority: 'MEDIUM',
        sentiment: 'neutral',
        language: 'RU',
        suggestedDepartment: null,
        autoReply: null,
        canAutoResolve: false,
        confidence: 0.5,
      };
    }
  }

  // Create ticket with AI classification and FAQ auto-resolve
  async create(userId: string, dto: CreateTicketDto) {
    // Get AI classification
    const aiResult = await this.classifyTicket(dto.subject, dto.description);
    
    // Check FAQ database
    const faqCheck = this.checkFAQ(dto.subject, dto.description, aiResult.language);

    // Find department if suggested
    let departmentId: string | null = null;
    if (aiResult.suggestedDepartment) {
      const dept = await this.prisma.department.findFirst({
        where: { name: { contains: aiResult.suggestedDepartment, mode: 'insensitive' } },
      });
      departmentId = dept?.id || null;
    }

    // Determine if we can auto-resolve (FAQ match or AI high confidence)
    const shouldAutoResolve = faqCheck.isFAQ || (aiResult.canAutoResolve && aiResult.confidence >= 0.85);
    const autoReplyContent = faqCheck.answer || aiResult.autoReply;

    // Create ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        subject: dto.subject,
        description: dto.description,
        channel: dto.channel || 'WEB',
        language: aiResult.language || dto.language || 'RU',
        priority: aiResult.priority || 'MEDIUM',
        aiCategory: faqCheck.category || aiResult.category,
        aiSentiment: aiResult.sentiment,
        aiSuggestedReply: autoReplyContent,
        // Auto-resolve FAQ tickets
        status: shouldAutoResolve ? 'RESOLVED' : 'OPEN',
        resolvedAt: shouldAutoResolve ? new Date() : null,
        clientId: userId,
        departmentId,
        // SLA: 24 hours for now
        slaDeadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });

    // Create auto-reply message
    if (autoReplyContent) {
      // Get system/bot user for AI messages
      let botUser = await this.prisma.user.findFirst({
        where: { email: 'ai@qoldai.kz' },
      });
      
      if (!botUser) {
        botUser = await this.prisma.user.create({
          data: {
            email: 'ai@qoldai.kz',
            name: 'QoldAI Assistant',
            role: 'OPERATOR',
          },
        });
      }

      await this.prisma.ticketMessage.create({
        data: {
          ticketId: ticket.id,
          senderId: botUser.id,
          content: shouldAutoResolve 
            ? `${autoReplyContent}\n\n---\n✅ *Этот запрос был автоматически решён AI-ассистентом. Если вам нужна дополнительная помощь, просто ответьте на это сообщение.*`
            : autoReplyContent,
          isAiGenerated: true,
        },
      });
    }

    return ticket;
  }

  // Get all tickets (for operators/admins)
  async findAll(filters: TicketFilterDto) {
    const where: any = {};

    if (filters.status) where.status = filters.status;
    if (filters.priority) where.priority = filters.priority;
    if (filters.departmentId) where.departmentId = filters.departmentId;
    if (filters.operatorId) where.operatorId = filters.operatorId;
    if (filters.search) {
      where.OR = [
        { subject: { contains: filters.search, mode: 'insensitive' } },
        { description: { contains: filters.search, mode: 'insensitive' } },
      ];
    }

    return this.prisma.ticket.findMany({
      where,
      include: {
        client: { select: { id: true, name: true, email: true } },
        operator: { select: { id: true, name: true, email: true } },
        department: true,
        _count: { select: { messages: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  // Get user's tickets
  async findMyTickets(userId: string) {
    return this.prisma.ticket.findMany({
      where: { clientId: userId },
      include: {
        operator: { select: { id: true, name: true } },
        department: true,
        _count: { select: { messages: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });
  }

  // Get tickets assigned to operator
  async findOperatorTickets(operatorId: string) {
    return this.prisma.ticket.findMany({
      where: { operatorId },
      include: {
        client: { select: { id: true, name: true, email: true } },
        department: true,
        _count: { select: { messages: true } },
      },
      orderBy: [
        { priority: 'desc' },
        { updatedAt: 'desc' },
      ],
    });
  }

  // Get single ticket with messages
  async findOne(ticketId: string, userId: string, userRole: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        client: { select: { id: true, name: true, email: true, image: true } },
        operator: { select: { id: true, name: true, email: true, image: true } },
        department: true,
        messages: {
          include: {
            sender: { select: { id: true, name: true, image: true, role: true } },
          },
          orderBy: { createdAt: 'asc' },
        },
        attachments: true,
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check access
    if (userRole === 'CLIENT' && ticket.clientId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    return ticket;
  }

  // Update ticket
  async update(ticketId: string, userId: string, userRole: string, dto: UpdateTicketDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Clients can only update their own tickets and limited fields
    if (userRole === 'CLIENT') {
      if (ticket.clientId !== userId) {
        throw new ForbiddenException('Access denied');
      }
      // Clients can only update subject/description if ticket is open
      if (ticket.status !== 'OPEN') {
        throw new ForbiddenException('Cannot modify ticket in current status');
      }
      const { subject, description } = dto;
      return this.prisma.ticket.update({
        where: { id: ticketId },
        data: { subject, description },
      });
    }

    // Operators/Admins can update all fields
    const updateData: any = { ...dto };
    
    // If status changed to RESOLVED, set resolvedAt
    if (dto.status === 'RESOLVED' && ticket.status !== 'RESOLVED') {
      updateData.resolvedAt = new Date();
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: updateData,
      include: {
        client: { select: { id: true, name: true, email: true } },
        operator: { select: { id: true, name: true, email: true } },
        department: true,
      },
    });
  }

  // Add message to ticket
  async addMessage(ticketId: string, userId: string, userRole: string, dto: CreateTicketMessageDto) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    // Check access
    if (userRole === 'CLIENT' && ticket.clientId !== userId) {
      throw new ForbiddenException('Access denied');
    }

    const message = await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        content: dto.content,
        isAiGenerated: dto.isAiGenerated || false,
      },
      include: {
        sender: { select: { id: true, name: true, image: true, role: true } },
      },
    });

    // Update ticket status based on who sent the message
    let newStatus = ticket.status;
    if (userRole === 'CLIENT' && ticket.status === 'WAITING_CLIENT') {
      newStatus = 'WAITING_OPERATOR';
    } else if (userRole !== 'CLIENT' && ticket.status === 'WAITING_OPERATOR') {
      newStatus = 'WAITING_CLIENT';
    } else if (ticket.status === 'OPEN' && userRole !== 'CLIENT') {
      newStatus = 'IN_PROGRESS';
    }

    if (newStatus !== ticket.status) {
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { status: newStatus },
      });
    }

    return message;
  }

  // Generate AI response suggestion for operator
  async generateSuggestion(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: {
          orderBy: { createdAt: 'asc' },
          take: 10,
        },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const conversationHistory = ticket.messages
      .map(m => `${m.isAiGenerated ? 'AI' : 'User'}: ${m.content}`)
      .join('\n');

    const systemPrompt = `You are a helpful support assistant. Based on the ticket and conversation history, suggest a professional response for the support operator.
The response should be in the same language as the conversation.
Be helpful, professional, and try to resolve the issue.`;

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { 
            role: 'user', 
            content: `Ticket Subject: ${ticket.subject}\nDescription: ${ticket.description}\n\nConversation:\n${conversationHistory}\n\nSuggest a response:` 
          }
        ],
        temperature: 0.7,
      });

      return {
        suggestion: response.choices[0].message.content,
      };
    } catch (error) {
      console.error('AI Suggestion error:', error);
      throw error;
    }
  }

  // Summarize ticket for operator
  async summarize(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        messages: { orderBy: { createdAt: 'asc' } },
      },
    });

    if (!ticket) {
      throw new NotFoundException('Ticket not found');
    }

    const conversationHistory = ticket.messages
      .map(m => m.content)
      .join('\n---\n');

    try {
      const response = await this.openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          { 
            role: 'system', 
            content: 'Summarize this support ticket conversation in 2-3 sentences. Include the main issue and current status.' 
          },
          { 
            role: 'user', 
            content: `Subject: ${ticket.subject}\n\n${conversationHistory}` 
          }
        ],
        temperature: 0.3,
      });

      const summary = response.choices[0].message.content;

      // Save summary to ticket
      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: { aiSummary: summary },
      });

      return { summary };
    } catch (error) {
      console.error('AI Summary error:', error);
      throw error;
    }
  }

  // Get statistics - Extended monitoring panel
  async getStats() {
    const [
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      // Auto-resolved (AI closed without operator)
      autoResolvedTickets,
      // Tickets with AI classification
      aiClassifiedTickets,
      // Tickets by channel
      webTickets,
      emailTickets,
      telegramTickets,
      // Language distribution
      ruTickets,
      kzTickets,
      enTickets,
      // SLA breached
      slaBreachedTickets,
    ] = await Promise.all([
      this.prisma.ticket.count(),
      this.prisma.ticket.count({ where: { status: 'OPEN' } }),
      this.prisma.ticket.count({ where: { status: 'IN_PROGRESS' } }),
      this.prisma.ticket.count({ where: { status: 'RESOLVED' } }),
      this.prisma.ticket.count({ where: { status: 'CLOSED' } }),
      this.prisma.ticket.count({ where: { priority: 'URGENT' } }),
      // Auto-resolved: resolved without operator assignment
      this.prisma.ticket.count({ 
        where: { 
          status: { in: ['RESOLVED', 'CLOSED'] },
          operatorId: null,
        } 
      }),
      // AI classified
      this.prisma.ticket.count({ where: { aiCategory: { not: null } } }),
      // By channel
      this.prisma.ticket.count({ where: { channel: 'WEB' } }),
      this.prisma.ticket.count({ where: { channel: 'EMAIL' } }),
      this.prisma.ticket.count({ where: { channel: 'TELEGRAM' } }),
      // By language
      this.prisma.ticket.count({ where: { language: 'RU' } }),
      this.prisma.ticket.count({ where: { language: 'KZ' } }),
      this.prisma.ticket.count({ where: { language: 'EN' } }),
      // SLA breached (deadline passed but not resolved)
      this.prisma.ticket.count({ 
        where: { 
          status: { notIn: ['RESOLVED', 'CLOSED'] },
          slaDeadline: { lt: new Date() },
        } 
      }),
    ]);

    // Calculate average resolution time
    const resolvedWithTime = await this.prisma.ticket.findMany({
      where: { 
        status: 'RESOLVED',
        resolvedAt: { not: null },
      },
      select: {
        createdAt: true,
        resolvedAt: true,
      },
    });

    let avgResolutionTime = 0;
    if (resolvedWithTime.length > 0) {
      const totalTime = resolvedWithTime.reduce((acc, t) => {
        return acc + (t.resolvedAt!.getTime() - t.createdAt.getTime());
      }, 0);
      avgResolutionTime = Math.round(totalTime / resolvedWithTime.length / (1000 * 60 * 60)); // hours
    }

    // Calculate average first response time (time to first operator message)
    const ticketsWithFirstResponse = await this.prisma.ticket.findMany({
      where: {
        messages: {
          some: { isAiGenerated: false },
        },
      },
      select: {
        createdAt: true,
        messages: {
          where: { isAiGenerated: false },
          orderBy: { createdAt: 'asc' },
          take: 1,
          select: { createdAt: true },
        },
      },
    });

    let avgFirstResponseTime = 0;
    const ticketsWithResponse = ticketsWithFirstResponse.filter(t => t.messages.length > 0);
    if (ticketsWithResponse.length > 0) {
      const totalResponseTime = ticketsWithResponse.reduce((acc, t) => {
        return acc + (t.messages[0].createdAt.getTime() - t.createdAt.getTime());
      }, 0);
      avgFirstResponseTime = Math.round(totalResponseTime / ticketsWithResponse.length / (1000 * 60)); // minutes
    }

    // Category distribution (AI classification accuracy proxy)
    const categoryDistribution = await this.prisma.ticket.groupBy({
      by: ['aiCategory'],
      _count: { id: true },
      where: { aiCategory: { not: null } },
    });

    // Sentiment distribution
    const sentimentDistribution = await this.prisma.ticket.groupBy({
      by: ['aiSentiment'],
      _count: { id: true },
      where: { aiSentiment: { not: null } },
    });

    // Calculate rates
    const aiClassificationRate = totalTickets > 0 
      ? Math.round((aiClassifiedTickets / totalTickets) * 100) 
      : 0;
    
    const autoResolutionRate = totalTickets > 0 
      ? Math.round((autoResolvedTickets / totalTickets) * 100) 
      : 0;

    const slaComplianceRate = totalTickets > 0
      ? Math.round(((totalTickets - slaBreachedTickets) / totalTickets) * 100)
      : 100;

    return {
      // Basic counts
      totalTickets,
      openTickets,
      inProgressTickets,
      resolvedTickets,
      closedTickets,
      urgentTickets,
      
      // AI & Automation metrics (ТЗ requirement)
      aiClassifiedTickets,
      aiClassificationRate, // % тикетов с AI классификацией
      autoResolvedTickets,
      autoResolutionRate, // % авто-решённых (цель: 50%)
      
      // Response times (ТЗ requirement)
      avgResolutionTimeHours: avgResolutionTime,
      avgFirstResponseTimeMinutes: avgFirstResponseTime,
      
      // SLA metrics
      slaBreachedTickets,
      slaComplianceRate, // % соответствия SLA
      
      // Channel distribution
      channelDistribution: {
        web: webTickets,
        email: emailTickets,
        telegram: telegramTickets,
      },
      
      // Language distribution (ТЗ: KZ/RU support)
      languageDistribution: {
        ru: ruTickets,
        kz: kzTickets,
        en: enTickets,
      },
      
      // AI insights
      categoryDistribution: categoryDistribution.map(c => ({
        category: c.aiCategory,
        count: c._count.id,
      })),
      sentimentDistribution: sentimentDistribution.map(s => ({
        sentiment: s.aiSentiment,
        count: s._count.id,
      })),
    };
  }

  // Assign ticket to operator
  async assignToOperator(ticketId: string, operatorId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { 
        operatorId,
        status: 'IN_PROGRESS',
      },
      include: {
        client: { select: { id: true, name: true, email: true } },
        operator: { select: { id: true, name: true, email: true } },
      },
    });
  }

  // Get timeline statistics (last 7 days)
  async getTimelineStats() {
    const days = 7;
    const timeline = [];
    
    for (let i = days - 1; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      date.setHours(0, 0, 0, 0);
      
      const nextDate = new Date(date);
      nextDate.setDate(nextDate.getDate() + 1);
      
      const [created, resolved] = await Promise.all([
        this.prisma.ticket.count({
          where: {
            createdAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
        this.prisma.ticket.count({
          where: {
            resolvedAt: {
              gte: date,
              lt: nextDate,
            },
          },
        }),
      ]);
      
      timeline.push({
        date: date.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit' }),
        created,
        resolved,
      });
    }
    
    return { timeline };
  }
}
