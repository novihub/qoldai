import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { MailService } from './mail.service';
import * as Imap from 'imap';
import { simpleParser, ParsedMail } from 'mailparser';
import { Readable } from 'stream';

interface EmailMessage {
  from: string;
  fromName?: string;
  subject: string;
  text: string;
  html?: string;
  date: Date;
  messageId?: string;
}

@Injectable()
export class EmailChannelService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(EmailChannelService.name);
  private imap: Imap | null = null;
  private isConfigured = false;
  private pollingInterval: NodeJS.Timeout | null = null;
  private isProcessing = false;

  // IMAP configuration
  private readonly imapConfig: Imap.Config | null;

  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
    private mailService: MailService,
  ) {
    const imapHost = this.configService.get('IMAP_HOST');
    const imapUser = this.configService.get('IMAP_USER');
    const imapPassword = this.configService.get('IMAP_PASSWORD');

    if (imapHost && imapUser && imapPassword) {
      this.imapConfig = {
        user: imapUser,
        password: imapPassword,
        host: imapHost,
        port: this.configService.get('IMAP_PORT', 993),
        tls: this.configService.get('IMAP_TLS', 'true') === 'true',
        tlsOptions: { rejectUnauthorized: false },
      };
      this.isConfigured = true;
      this.logger.log(`  Email channel configured for ${imapUser}@${imapHost}`);
    } else {
      this.logger.warn('  Email channel not configured. Set IMAP_HOST, IMAP_USER, IMAP_PASSWORD env vars.');
    }
  }

  async onModuleInit() {
    if (this.isConfigured) {
      // Start polling every 2 minutes
      const pollIntervalMs = this.configService.get('EMAIL_POLL_INTERVAL', 120000);
      this.pollingInterval = setInterval(() => this.checkNewEmails(), pollIntervalMs);
      
      // Initial check
      setTimeout(() => this.checkNewEmails(), 5000);
      this.logger.log(`  Email polling started (every ${pollIntervalMs / 1000}s)`);
    }
  }

  async onModuleDestroy() {
    if (this.pollingInterval) {
      clearInterval(this.pollingInterval);
    }
    if (this.imap) {
      this.imap.end();
    }
  }

  /**
   * Check for new unread emails and process them
   */
  async checkNewEmails(): Promise<void> {
    if (!this.isConfigured || !this.imapConfig) {
      return;
    }

    if (this.isProcessing) {
      this.logger.debug('Email processing already in progress, skipping...');
      return;
    }

    this.isProcessing = true;

    try {
      const emails = await this.fetchUnreadEmails();
      this.logger.log(`  Found ${emails.length} new emails`);

      for (const email of emails) {
        await this.processEmail(email);
      }
    } catch (error: any) {
      this.logger.error(`Failed to check emails: ${error.message}`);
    } finally {
      this.isProcessing = false;
    }
  }

  /**
   * Fetch unread emails from IMAP server with timeout
   */
  private fetchUnreadEmails(): Promise<EmailMessage[]> {
    return new Promise((resolve, reject) => {
      if (!this.imapConfig) {
        return resolve([]);
      }

      const emails: EmailMessage[] = [];
      const imap = new Imap(this.imapConfig);
      let resolved = false;

      // Timeout after 30 seconds
      const timeout = setTimeout(() => {
        if (!resolved) {
          resolved = true;
          this.logger.error('IMAP connection timeout after 30s');
          try { imap.end(); } catch (e) {}
          resolve([]);
        }
      }, 30000);

      const cleanup = () => {
        clearTimeout(timeout);
        if (!resolved) {
          resolved = true;
        }
      };

      imap.once('ready', () => {
        imap.openBox('INBOX', false, (err, box) => {
          if (err) {
            cleanup();
            imap.end();
            return reject(err);
          }

          // Search for UNSEEN emails
          imap.search(['UNSEEN'], (err, results) => {
            if (err) {
              cleanup();
              imap.end();
              return reject(err);
            }

            if (!results || results.length === 0) {
              cleanup();
              imap.end();
              return resolve([]);
            }

            const fetch = imap.fetch(results, {
              bodies: '',
              markSeen: true, // Mark as read after fetching
            });

            fetch.on('message', (msg) => {
              msg.on('body', (stream: Readable) => {
                simpleParser(stream, (err, parsed: ParsedMail) => {
                  if (err) {
                    this.logger.error(`Failed to parse email: ${err.message}`);
                    return;
                  }

                  const fromAddress = parsed.from?.value?.[0];
                  // Clean subject from any trailing null bytes or whitespace
                  const cleanSubject = (parsed.subject || 'No Subject')
                    .replace(/\0/g, '')
                    .replace(/\s+$/, '')
                    .trim();
                  
                  emails.push({
                    from: fromAddress?.address || 'unknown@email.com',
                    fromName: fromAddress?.name,
                    subject: cleanSubject,
                    text: parsed.text || '',
                    html: parsed.html || undefined,
                    date: parsed.date || new Date(),
                    messageId: parsed.messageId,
                  });
                });
              });
            });

            fetch.once('error', (err) => {
              this.logger.error(`Fetch error: ${err.message}`);
            });

            fetch.once('end', () => {
              // Wait a bit for parsing to complete
              setTimeout(() => {
                cleanup();
                imap.end();
                resolve(emails);
              }, 1000);
            });
          });
        });
      });

      imap.once('error', (err: Error) => {
        cleanup();
        this.logger.error(`IMAP error: ${err.message}`);
        resolve([]); // Don't reject, just return empty
      });

      imap.once('end', () => {
        this.logger.debug('IMAP connection ended');
      });

      try {
        imap.connect();
      } catch (err: any) {
        cleanup();
        this.logger.error(`IMAP connect error: ${err.message}`);
        resolve([]);
      }
    });
  }

  /**
   * Process an incoming email - create ticket or add message
   */
  private async processEmail(email: EmailMessage): Promise<void> {
    this.logger.log(`  Processing email from ${email.from}: ${email.subject}`);

    try {
      // Find or create user by email
      let user = await this.prisma.user.findUnique({
        where: { email: email.from },
      });

      if (!user) {
        // Create new user for this email
        user = await this.prisma.user.create({
          data: {
            email: email.from,
            name: email.fromName || email.from.split('@')[0],
            role: 'CLIENT',
            emailVerified: null, // Email clients are unverified by default
          },
        });
        this.logger.log(`  Created new user for email: ${email.from}`);
      }

      // Check if this is a reply to existing ticket (by subject pattern)
      const ticketIdMatch = email.subject.match(/\[Ticket #([a-f0-9-]+)\]/i);
      
      if (ticketIdMatch) {
        // This is a reply to existing ticket
        const ticketId = ticketIdMatch[1];
        await this.addMessageToTicket(ticketId, user.id, email);
      } else {
        // New ticket
        await this.createTicketFromEmail(user.id, email);
      }

    } catch (error: any) {
      this.logger.error(`Failed to process email: ${error.message}`);
    }
  }

  /**
   * Create new ticket from email
   */
  private async createTicketFromEmail(userId: string, email: EmailMessage): Promise<void> {
    // Detect language from email content
    const language = this.detectLanguage(email.text) as 'RU' | 'KZ' | 'EN';

    // Create ticket
    const ticket = await this.prisma.ticket.create({
      data: {
        subject: email.subject,
        description: email.text.substring(0, 5000), // Limit description length
        clientId: userId,
        channel: 'EMAIL',
        language,
        status: 'OPEN',
        priority: 'MEDIUM',
      },
      include: {
        client: true,
      },
    });

    this.logger.log(`  Created ticket ${ticket.id} from email`);

    // Send auto-reply confirmation
    await this.sendTicketConfirmation(email.from, ticket.id, email.subject);

    // Try AI classification
    try {
      await this.classifyTicketWithAI(ticket.id, email.subject, email.text);
    } catch (error: any) {
      this.logger.error(`AI classification failed: ${error.message}`);
    }
  }

  /**
   * Add message to existing ticket
   */
  private async addMessageToTicket(ticketId: string, userId: string, email: EmailMessage): Promise<void> {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
    });

    if (!ticket) {
      this.logger.warn(`Ticket ${ticketId} not found, creating new ticket`);
      await this.createTicketFromEmail(userId, email);
      return;
    }

    // Add message
    await this.prisma.ticketMessage.create({
      data: {
        ticketId,
        senderId: userId,
        content: email.text.substring(0, 5000),
        isAiGenerated: false,
      },
    });

    // Update ticket status
    await this.prisma.ticket.update({
      where: { id: ticketId },
      data: {
        status: ticket.status === 'WAITING_CLIENT' ? 'IN_PROGRESS' : ticket.status,
        updatedAt: new Date(),
      },
    });

    this.logger.log(`  Added message to ticket ${ticketId}`);
  }

  /**
   * Send ticket confirmation email
   */
  private async sendTicketConfirmation(to: string, ticketId: string, originalSubject: string): Promise<void> {
    const subject = `[Ticket #${ticketId}] ${originalSubject}`;
    const webUrl = this.configService.get('WEB_URL', 'http://localhost:3000');

    await this.mailService.sendEmail(to, subject, `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>  Ваше обращение принято!</h2>
        <p>Мы получили ваше обращение и уже работаем над ним.</p>
        
        <div style="background-color: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 16px; margin: 20px 0;">
          <p style="margin: 0; font-weight: bold;">Номер обращения: #${ticketId.substring(0, 8)}</p>
          <p style="margin: 8px 0 0 0;">Тема: ${originalSubject}</p>
        </div>
        
        <p>Вы можете отслеживать статус обращения:</p>
        <a href="${webUrl}/tickets/${ticketId}" style="display: inline-block; background-color: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; margin: 10px 0;">
          Открыть обращение
        </a>
        
        <p style="color: #6b7280; font-size: 14px; margin-top: 20px;">
          Отвечайте на это письмо, чтобы добавить информацию к вашему обращению.
        </p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="color: #9ca3af; font-size: 12px;">
          QoldAI - Интеллектуальная система поддержки клиентов
        </p>
      </div>
    `);

    this.logger.log(`  Sent confirmation email for ticket ${ticketId}`);
  }

  /**
   * Detect language from text (simple heuristic)
   */
  private detectLanguage(text: string): 'RU' | 'KZ' | 'EN' {
    // Kazakh specific characters and words
    const kazakh = /[әіңғүұқөһ]|сәлем|рахмет|қалай/i;
    if (kazakh.test(text)) {
      return 'KZ';
    }
    
    // Russian check
    const russian = /[а-яё]/i;
    const english = /^[a-z\s\d.,!?'"()-]+$/i;
    
    if (russian.test(text) && !english.test(text.replace(/[а-яёәіңғүұқөһ]/gi, ''))) {
      return 'RU';
    }
    
    return 'EN';
  }

  /**
   * Call AI to classify ticket
   */
  private async classifyTicketWithAI(ticketId: string, subject: string, description: string): Promise<void> {
    // Import dynamically to avoid circular dependency
    const openaiKey = this.configService.get('OPENAI_API_KEY');
    if (!openaiKey) return;

    const prompt = `Classify this customer support ticket:
Subject: ${subject}
Description: ${description.substring(0, 1000)}

Return JSON with:
- category: one of [billing, technical, general, account, shipping]
- priority: one of [LOW, MEDIUM, HIGH, URGENT]
- sentiment: one of [positive, neutral, negative]`;

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${openaiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_object' },
        }),
      });

      const data = await response.json();
      const result = JSON.parse(data.choices[0].message.content);

      await this.prisma.ticket.update({
        where: { id: ticketId },
        data: {
          aiCategory: result.category,
          priority: result.priority,
          aiSentiment: result.sentiment,
        },
      });

      this.logger.log(`  AI classified ticket ${ticketId}: ${result.category}, ${result.priority}`);
    } catch (error: any) {
      this.logger.error(`AI classification error: ${error.message}`);
    }
  }

  /**
   * Manually trigger email check (for testing)
   */
  async triggerEmailCheck(): Promise<{ processed: number }> {
    if (!this.isConfigured) {
      throw new Error('Email channel not configured');
    }

    const emails = await this.fetchUnreadEmails();
    for (const email of emails) {
      await this.processEmail(email);
    }

    return { processed: emails.length };
  }

  /**
   * Simulate receiving an email (for testing without IMAP)
   */
  async simulateEmailReceive(
    from: string,
    subject: string,
    body: string,
  ): Promise<{ ticketId: string; userId: string }> {
    const email: EmailMessage = {
      from,
      fromName: from.split('@')[0],
      subject,
      text: body,
      date: new Date(),
    };

    // Find or create user
    let user = await this.prisma.user.findUnique({
      where: { email: from },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: from,
          name: from.split('@')[0],
          role: 'CLIENT',
          emailVerified: null,
        },
      });
      this.logger.log(`  [Test] Created new user: ${from}`);
    }

    // Check if reply to existing ticket
    const ticketIdMatch = subject.match(/\[Ticket #([a-f0-9-]+)\]/i);
    
    if (ticketIdMatch) {
      const ticketId = ticketIdMatch[1];
      const ticket = await this.prisma.ticket.findUnique({
        where: { id: ticketId },
      });

      if (ticket) {
        await this.prisma.ticketMessage.create({
          data: {
            ticketId,
            senderId: user.id,
            content: body.substring(0, 5000),
            isAiGenerated: false,
          },
        });
        this.logger.log(`  [Test] Added message to ticket ${ticketId}`);
        return { ticketId, userId: user.id };
      }
    }

    // Create new ticket
    const language = this.detectLanguage(body);
    const ticket = await this.prisma.ticket.create({
      data: {
        subject,
        description: body.substring(0, 5000),
        clientId: user.id,
        channel: 'EMAIL',
        language,
        status: 'OPEN',
        priority: 'MEDIUM',
      },
    });

    this.logger.log(`  [Test] Created ticket ${ticket.id} from simulated email`);

    // Try AI classification
    try {
      await this.classifyTicketWithAI(ticket.id, subject, body);
    } catch (error: any) {
      this.logger.error(`AI classification failed: ${error.message}`);
    }

    return { ticketId: ticket.id, userId: user.id };
  }
}
