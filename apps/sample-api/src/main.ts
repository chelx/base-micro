import { NestFactory } from '@nestjs/core';
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
    title: 'Sample API',
    description: 'Sample microservice with Todo features',
    version: '1.0',
    path: 'api/docs'
  });

  const port = process.env.PORT || 3000;
  await app.listen(port);
  logger.log(
    `🚀 SampleAPI HTTP running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `🚀 SampleAPI Swagger UI: http://localhost:${port}/${globalPrefix}/docs`,
  );
}

bootstrap();
