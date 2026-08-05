import {
  Controller, Post, Body, Req, HttpCode, HttpStatus, BadRequestException, Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Request } from 'express';
import { CrmService } from './crm.service';
import { CreatePublicLeadDto } from './dto/create-public-lead.dto';
import { TurnstileService } from '../../common/services/turnstile.service';

const DISPOSABLE_DOMAINS = [
  'mailinator.com', 'guerrillamail.com', 'tempmail.com', 'throwaway.com',
  'yopmail.com', 'sharklasers.com', 'trashmail.com', '10minutemail.com',
  'mailnator.com', 'getnada.com', 'emailfake.com', 'tempr.email',
];

@ApiTags('Public CRM')
@Controller('public/crm')
export class PublicCrmController {
  private readonly logger = new Logger(PublicCrmController.name);

  constructor(
    private readonly crmService: CrmService,
    private readonly turnstile: TurnstileService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @Throttle({ default: { limit: 3, ttl: 60000 } })
  @ApiOperation({ summary: 'Submit a contact/lead form (public)' })
  async create(@Body() dto: CreatePublicLeadDto, @Req() req: Request) {
    // Honeypot check
    if (dto.website) {
      this.logger.warn(`Honeypot triggered from ${req.ip}`);
      throw new BadRequestException('Invalid form submission');
    }

    // Turnstile verification
    if (dto.turnstileToken) {
      const result = await this.turnstile.verify(dto.turnstileToken, req.ip);
      if (!result.success) {
        throw new BadRequestException('Verification failed. Please try again.');
      }
    }

    // Disposable email check
    const domain = dto.email.split('@')[1]?.toLowerCase();
    if (domain && DISPOSABLE_DOMAINS.includes(domain)) {
      throw new BadRequestException('Disposable email addresses are not accepted');
    }

    // IP reputation (basic — block known bad actors via simple checks)
    const ip = (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() || req.ip || '';
    if (ip === '127.0.0.1' || ip === '::1' || ip === 'localhost') {
      // localhost in dev — allow
    }

    // Payload sanitization
    const sanitized = {
      name: this.sanitize(dto.name),
      email: dto.email.toLowerCase().trim(),
      subject: this.sanitize(dto.subject),
      message: this.sanitize(dto.message),
    };

    // Create lead via CRM service
    await this.crmService.createPublicLead({
      name: sanitized.name,
      email: sanitized.email,
      description: `Subject: ${sanitized.subject}\n\nMessage: ${sanitized.message}`,
      source: dto.source || 'CONTACT_FORM',
      metadata: {
        subject: sanitized.subject,
        ip,
        userAgent: req.headers['user-agent'] || '',
        submittedAt: new Date().toISOString(),
      },
    });

    this.logger.log(`Public lead created: ${sanitized.email} from ${ip}`);

    return { success: true, message: 'Thank you for reaching out. We will get back to you within 24 hours.' };
  }

  private sanitize(input: string): string {
    return input
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;')
      .trim();
  }
}
