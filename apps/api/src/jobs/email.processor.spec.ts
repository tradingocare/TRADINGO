import { Test, TestingModule } from '@nestjs/testing';
import { EmailProcessor } from './email.processor';
import { SESClient, SendEmailCommand } from '@aws-sdk/client-ses';
import { Resend } from 'resend';
import { PrismaService } from '../prisma/prisma.service';
import { ConfigService } from '@nestjs/config';
import { createMockPrisma } from '../common/test/test-utils';
import { QueueNames, EmailJobTypes } from './queues';

jest.mock('resend', () => {
  const sendMock = jest.fn().mockResolvedValue({ data: { id: 'email_test_123' } });
  return { Resend: jest.fn().mockImplementation(() => ({ emails: { send: sendMock } })) };
});

jest.mock('@aws-sdk/client-ses', () => {
  const sendMock = jest.fn().mockResolvedValue({});
  const SESClient = jest.fn().mockImplementation(() => ({ send: sendMock }));
  const SendEmailCommand = jest.fn().mockImplementation((params: unknown) => params);
  return { SESClient, SendEmailCommand };
});

describe('EmailProcessor', () => {
  let processor: EmailProcessor;
  let prisma: ReturnType<typeof createMockPrisma>;
  let config: { get: jest.Mock };

  const buildConfig = (values: Record<string, unknown>): { get: jest.Mock } => ({
    get: jest.fn((key: string, fallback?: unknown) => {
      if (key in values) return values[key];
      return fallback;
    }),
  });

  const buildProcessor = async (values: Record<string, unknown>): Promise<EmailProcessor> => {
    prisma = createMockPrisma();
    config = buildConfig(values);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        EmailProcessor,
        { provide: PrismaService, useValue: prisma },
        { provide: ConfigService, useValue: config },
      ],
    }).compile();

    return module.get<EmailProcessor>(EmailProcessor);
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', async () => {
    processor = await buildProcessor({});
    expect(processor).toBeDefined();
  });

  describe('provider selection', () => {
    it('should default to ses when EMAIL_PROVIDER is unset', async () => {
      processor = await buildProcessor({ 'aws.accessKeyId': 'AKIA_TEST', 'aws.secretAccessKey': 'secret' });

      const sendSpy = (SESClient as unknown as jest.Mock).mock.results[0].value.send;
      const job = {
        id: 'job-1',
        data: { to: 'test@test.com', subject: 'Hello', template: 'notification', context: { name: 'Test' }, type: EmailJobTypes.SEND_NOTIFICATION },
      };
      await processor.process(job as any);

      expect(SendEmailCommand).toHaveBeenCalled();
      const command = (SendEmailCommand as unknown as jest.Mock).mock.calls[0][0];
      expect(command.Source).toBe('noreply@tradingotech.com');
      expect(command.Destination.ToAddresses).toEqual(['test@test.com']);
      expect(command.Message.Subject.Data).toBe('Hello');
      expect(command.Message.Body.Html.Data).toContain('Test');
      expect(sendSpy).toHaveBeenCalled();
    });

    it('should select resend when EMAIL_PROVIDER=resend', async () => {
      processor = await buildProcessor({
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test_key',
        EMAIL_FROM: 'noreply@tradingo.in',
      });

      const job = {
        id: 'job-1',
        data: { to: 'test@test.com', subject: 'Reset', template: 'password-reset', context: { name: 'Test', otp: '123456' }, type: EmailJobTypes.SEND_PASSWORD_RESET },
      };
      await processor.process(job as any);

      const resendSend = ((Resend as unknown as jest.Mock).mock.results[0].value.emails.send as jest.Mock);
      expect(resendSend).toHaveBeenCalledWith({
        from: 'noreply@tradingo.in',
        to: 'test@test.com',
        subject: 'Reset',
        html: expect.stringContaining('123456'),
      });
    });

    it('should prefer RESEND_FROM over EMAIL_FROM for resend', async () => {
      processor = await buildProcessor({
        EMAIL_PROVIDER: 'resend',
        RESEND_API_KEY: 're_test_key',
        RESEND_FROM: 'hello@tradingo.in',
        EMAIL_FROM: 'noreply@tradingo.in',
      });

      const job = {
        id: 'job-1',
        data: { to: 'someone@test.com', subject: 'Hi', template: 'notification', context: { name: 'A' }, type: EmailJobTypes.SEND_NOTIFICATION },
      };
      await processor.process(job as any);

      const resendSend = ((Resend as unknown as jest.Mock).mock.results[0].value.emails.send as jest.Mock);
      expect(resendSend).toHaveBeenCalledWith(
        expect.objectContaining({ from: 'hello@tradingo.in' }),
      );
    });
  });

  describe('process', () => {
    it('should skip email delivery when SES is not configured (default provider)', async () => {
      processor = await buildProcessor({});
      const job = { data: { to: 'test@test.com', subject: 'Test', body: 'Hello', type: EmailJobTypes.SEND_NOTIFICATION }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
      expect(SendEmailCommand).not.toHaveBeenCalled();
    });

    it('should skip emails when EMAIL_PROVIDER=resend but RESEND_API_KEY is missing', async () => {
      processor = await buildProcessor({ EMAIL_PROVIDER: 'resend' });
      const job = { data: { to: 'test@test.com', subject: 'Test', type: EmailJobTypes.SEND_NOTIFICATION }, id: 'job-1' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
      expect(Resend).not.toHaveBeenCalled();
    });

    it('should handle missing recipient gracefully', async () => {
      processor = await buildProcessor({});
      const job = { data: {}, id: 'job-2' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
    });

    it('should warn on unknown email job type without crashing', async () => {
      processor = await buildProcessor({ EMAIL_PROVIDER: 'resend', RESEND_API_KEY: 're_test_key' });
      const job = { data: { to: 'x@y.com', subject: 'S', template: 'welcome', context: {}, type: 'UNKNOWN_TYPE' }, id: 'job-3' };
      const result = await processor.process(job as any);
      expect(result).toBeUndefined();
    });
  });
});