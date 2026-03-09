import { Test, TestingModule } from '@nestjs/testing';
import { NotificationConsumer } from './kafka.consumer';
import { NotificationService } from './notification.service';
import { NotificationChannel } from './entities';

describe('NotificationConsumer', () => {
  let consumer: NotificationConsumer;
  let notificationService: jest.Mocked<Partial<NotificationService>>;

  beforeEach(async () => {
    notificationService = {
      sendNotification: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationConsumer],
      providers: [
        { provide: NotificationService, useValue: notificationService },
      ],
    }).compile();

    consumer = module.get<NotificationConsumer>(NotificationConsumer);
  });

  it('should process incoming Kafka messages and call sendNotification', async () => {
    const mockMessage = {
      channel: NotificationChannel.EMAIL,
      payload: {
        recipient: 'test@example.com',
        subject: 'Welcome',
        body: 'Hello there!',
      },
    };

    const mockCtx = {} as any; // Mock KafkaContext if needed

    await consumer.handleNotificationSend(mockMessage, mockCtx);

    expect(notificationService.sendNotification).toHaveBeenCalledWith(
      NotificationChannel.EMAIL,
      mockMessage.payload,
    );
  });

  it('should log errors gracefully if sendNotification throws', async () => {
    const mockMessage = {
      channel: NotificationChannel.EMAIL,
      payload: { recipient: 'bad@example.com', body: 'err' },
    };

    notificationService.sendNotification.mockRejectedValue(
      new Error('Simulated Error'),
    );
    const mockCtx = {} as any;

    await expect(
      consumer.handleNotificationSend(mockMessage, mockCtx),
    ).resolves.toBeUndefined();
    // Resolving without throwing implies error was caught and logged gracefully (preventing poison pill messages from crashing the consumer repeatedly if unchecked)
  });
});
