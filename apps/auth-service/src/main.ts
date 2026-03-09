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
    title: 'Auth Service',
    description: 'Authentication and Authorization API',
    version: '1.0',
    path: 'api/docs'
  });

  // gRPC microservice transport
  app.connectMicroservice<MicroserviceOptions>({
    transport: Transport.GRPC,
    options: {
      package: 'auth',
      protoPath: join(__dirname, 'proto/auth.proto'),
      url: `0.0.0.0:${process.env.GRPC_PORT || 50051}`,
    },
  });

  await app.startAllMicroservices();

  const port = process.env.PORT || 3001;
  await app.listen(port);

  logger.log(
    `🚀 AuthService HTTP running on: http://localhost:${port}/${globalPrefix}`,
  );
  logger.log(
    `🚀 AuthService Swagger UI: http://localhost:${port}/${globalPrefix}/docs`,
  );
  logger.log(
    `🚀 AuthService gRPC running on: 0.0.0.0:${process.env.GRPC_PORT || 50051}`,
  );
}

bootstrap();
