import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
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
    title: 'Audit Service',
    description: 'Audit logging and traceability API',
    version: '1.0',
    path: 'api/docs'
  });

  // Connect Kafka Microservice
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.KAFKA,
    options: {
      client: {
        brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
      },
      consumer: {
        groupId: 'audit-consumer-group',
      },
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3004;
  await app.listen(port);
  logger.log(
    `🚀 AuditService HTTP running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `🚀 AuditService Swagger UI: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
