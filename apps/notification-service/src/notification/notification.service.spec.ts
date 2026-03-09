import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { NotificationService } from './notification.service';
import {
  NotificationLog,
  NotificationChannel,
  NotificationStatus,
} from './entities';
import { EmailAdapter } from './adapters/email.adapter';
import { SmsAdapter } from './adapters/sms.adapter';
import { PushAdapter } from './adapters/push.adapter';

describe('NotificationService', () => {
  let service: NotificationService;
  let logRepo: jest.Mocked<Partial<Repository<NotificationLog>>>;
  let emailAdapter: jest.Mocked<Partial<EmailAdapter>>;
  let smsAdapter: jest.Mocked<Partial<SmsAdapter>>;
  let pushAdapter: jest.Mocked<Partial<PushAdapter>>;

  const mockPayload = {
    recipient: 'test@example.com',
    subject: 'Test Subject',
    body: 'Test Body',
  };

  const mockLog: NotificationLog = {
    id: 'log-1',
    channel: NotificationChannel.EMAIL,
    recipient: mockPayload.recipient,
    subject: mockPayload.subject,
    body: mockPayload.body,
    status: NotificationStatus.PENDING,
    retryCount: 0,
    error: null as any,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    logRepo = {
      create: jest.fn().mockImplementation((dto) => ({ ...mockLog, ...dto })),
      save: jest.fn().mockImplementation((log) => Promise.resolve(log)),
    };

    emailAdapter = {
      send: jest.fn(),
    };
    smsAdapter = {
      send: jest.fn(),
    };
    pushAdapter = {
      send: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationService,
        { provide: getRepositoryToken(NotificationLog), useValue: logRepo },
        { provide: EmailAdapter, useValue: emailAdapter },
        { provide: SmsAdapter, useValue: smsAdapter },
        { provide: PushAdapter, useValue: pushAdapter },
      ],
    }).compile();

    service = module.get<NotificationService>(NotificationService);
  });

  it('should route to email adapter and save SUCCESS status', async () => {
    emailAdapter.send.mockResolvedValue({ success: true, messageId: 'msg-1' });

    const result = await service.sendNotification(
      NotificationChannel.EMAIL,
      mockPayload,
    );

    expect(emailAdapter.send).toHaveBeenCalledWith(mockPayload);
    expect(result.status).toBe(NotificationStatus.SENT);
    expect(logRepo.save).toHaveBeenCalled();
  });

  it('should retry on failure up to MAX_RETRIES and set FAILED status', async () => {
    emailAdapter.send.mockResolvedValue({
      success: false,
      error: 'Simulated connection error',
    });

    const result = await service.sendNotification(
      NotificationChannel.EMAIL,
      mockPayload,
    );

    expect(emailAdapter.send).toHaveBeenCalledTimes(3); // max retries is 3
    expect(result.status).toBe(NotificationStatus.FAILED);
    expect(result.retryCount).toBe(3);
    expect(result.error).toContain('Simulated connection error');
    expect(logRepo.save).toHaveBeenCalled();
  });

  it('should recover if retry succeeds', async () => {
    emailAdapter.send
      .mockResolvedValueOnce({ success: false, error: 'fail 1' })
      .mockResolvedValueOnce({ success: false, error: 'fail 2' })
      .mockResolvedValueOnce({ success: true, messageId: 'msg-success' });

    const result = await service.sendNotification(
      NotificationChannel.EMAIL,
      mockPayload,
    );

    expect(emailAdapter.send).toHaveBeenCalledTimes(3);
    expect(result.status).toBe(NotificationStatus.SENT);
    // It succeeds on the 3rd attempt, so it doesn't fail out.
    // In our logic, retryCount is only updated in the catch block if it throws,
    // but the adapter.send returns {success: false}, which throws an Error our code catches.
  });
});
