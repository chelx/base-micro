import { NestFactory } from '@nestjs/core';
import { MicroserviceOptions, Transport } from '@nestjs/microservices';
import { join } from 'path';
import { AppModule } from './app/app.module';
import { BaseLogger, setupSwagger } from 'common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    bufferLogs: true,
  });
  app.useLogger(app.get(BaseLogger));

  const logger = app.get(BaseLogger);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);

  setupSwagger(app, {
    title: 'User Service',
    description: 'User and Profile Management API',
    version: '1.0',
    path: 'api/docs'
  });

  // gRPC microservice transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'user',
      protoPath: join(__dirname, 'proto/user.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 50052}`,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3002;
  await app.listen(port);

  logger.log(
    `🚀 UserService HTTP running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `🚀 UserService Swagger UI: http://localhost:${port}/${globalPrefix}/docs`,
  );
  logger.log(
    `🚀 UserService gRPC running on: 0.0.0.0:${process.env.GRPC_PORT || 50052}`,
  );
}

bootstrap();
