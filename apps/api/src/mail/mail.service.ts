import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly resendApiKey: string | undefined;
  private readonly fromEmail: string;

  constructor(private configService: ConfigService) {
    this.resendApiKey = this.configService.get('RESEND_API_KEY');
    this.fromEmail = this.configService.get('MAIL_FROM', 'noreply@notify.novitech.dev');

    if (this.resendApiKey) {
      this.logger.log('Resend configured for email delivery');
    } else {
      this.logger.warn('RESEND_API_KEY not configured. Emails will be logged to console.');
    }
  }

  async sendVerificationCode(email: string, code: string): Promise<void> {
    if (!this.resendApiKey) {
      // Log to console for development
      this.logger.log(`📧 Verification code for ${email}: ${code}`);
      return;
    }

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2>Email Verification</h2>
        <p>Your verification code is:</p>
        <div style="background-color: #f4f4f4; padding: 20px; text-align: center; font-size: 32px; font-weight: bold; letter-spacing: 8px; margin: 20px 0;">
          ${code}
        </div>
        <p>This code will expire in 10 minutes.</p>
        <p>If you didn't request this code, please ignore this email.</p>
      </div>
    `;

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to: email,
          subject: 'Verification Code',
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      this.logger.log(`📧 Email sent to ${email}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  /**
   * Generic email sending method
   */
  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    if (!this.resendApiKey) {
      this.logger.log(`📧 [Email] To: ${to}, Subject: ${subject}`);
      this.logger.log(`📧 HTML preview: ${html.substring(0, 200)}...`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send email');
      }

      this.logger.log(`📧 Email sent to ${to}: ${subject}`);
    } catch (error: any) {
      this.logger.error(`Failed to send email: ${error.message}`);
      throw error;
    }
  }

  async sendTicketReply(
    to: string,
    ticketId: string,
    subject: string,
    message: string,
    isAutoReply: boolean = false,
  ): Promise<void> {
    const replySubject = isAutoReply 
      ? `Re: ${subject} [Ticket #${ticketId}]` 
      : `Re: ${subject}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">QoldAI Support</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket #${ticketId}</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <div style="background-color: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          ${isAutoReply ? `
          <p style="color: #6b7280; font-size: 12px; margin-top: 16px;">
            This is an automated response. An operator will review your request shortly.
          </p>
          ` : ''}
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            To reply, simply respond to this email or visit our support portal.
          </p>
        </div>
      </div>
    `;

    if (!this.resendApiKey) {
      this.logger.log(`📧 [Ticket Reply] To: ${to}, Subject: ${replySubject}`);
      this.logger.log(`📧 Message: ${message}`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject: replySubject,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send ticket reply');
      }

      this.logger.log(`📧 Ticket reply sent to ${to} for ticket ${ticketId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send ticket reply: ${error.message}`);
      throw error;
    }
  }

  async sendTicketNotification(
    to: string,
    ticketId: string,
    status: string,
    message: string,
  ): Promise<void> {
    const statusColors: Record<string, string> = {
      'open': '#3b82f6',
      'in_progress': '#f59e0b',
      'resolved': '#10b981',
      'closed': '#6b7280',
    };

    const statusLabels: Record<string, string> = {
      'open': 'Open',
      'in_progress': 'In Progress',
      'resolved': 'Resolved',
      'closed': 'Closed',
    };

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #3b82f6; color: white; padding: 20px; border-radius: 8px 8px 0 0;">
          <h2 style="margin: 0;">QoldAI Support</h2>
          <p style="margin: 5px 0 0 0; opacity: 0.9;">Ticket Status Update</p>
        </div>
        <div style="background-color: #f9fafb; padding: 20px; border: 1px solid #e5e7eb; border-top: none;">
          <p style="margin: 0 0 12px 0;">Your ticket <strong>#${ticketId}</strong> has been updated.</p>
          <div style="display: inline-block; padding: 6px 12px; border-radius: 9999px; background-color: ${statusColors[status] || '#6b7280'}; color: white; font-size: 14px;">
            ${statusLabels[status] || status}
          </div>
          ${message ? `
          <div style="background-color: white; padding: 16px; border-radius: 8px; border: 1px solid #e5e7eb; margin-top: 16px;">
            ${message.replace(/\n/g, '<br>')}
          </div>
          ` : ''}
        </div>
        <div style="background-color: #f3f4f6; padding: 16px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <p style="margin: 0; color: #6b7280; font-size: 12px;">
            Visit our support portal to view your ticket details.
          </p>
        </div>
      </div>
    `;

    if (!this.resendApiKey) {
      this.logger.log(`📧 [Ticket Notification] To: ${to}, Ticket: ${ticketId}, Status: ${status}`);
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.resendApiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: this.fromEmail,
          to,
          subject: `Ticket #${ticketId} - Status Updated`,
          html,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to send notification');
      }

      this.logger.log(`📧 Notification sent to ${to} for ticket ${ticketId}`);
    } catch (error: any) {
      this.logger.error(`Failed to send notification: ${error.message}`);
    }
  }
}
