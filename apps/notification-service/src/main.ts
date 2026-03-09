import { NestFactory } from '@nestjs/core';
import { Transport } from '@nestjs/microservices';
import { AppModule } from './app/app.module';
import { BaseLogger, setupSwagger } from 'common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  const logger = app.get(BaseLogger);
  app.useLogger(logger);

  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  setupSwagger(app, {
    title: 'Notification Service',
    description: 'Multi-channel notification API',
    version: '1.0',
    path: 'api/docs'
  });

  app.connectMicroservice({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (process.env['KAFKA_BROKERS'] || 'localhost:9092').split(','),
      },
      consumer: {
        groupId: 'notification-consumer-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3005;
  await app.listen(port);
  logger.log(
    `🚀 NotificationService HTTP running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `🚀 NotificationService Swagger UI: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
