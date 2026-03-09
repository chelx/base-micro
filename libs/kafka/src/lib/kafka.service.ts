import {
  Injectable,
  Inject,
  OnModuleInit,
  OnModuleDestroy,
  Logger,
} from '@nestjs/common';
import { ClientKafka } from '@nestjs/microservices';

export const KAFKA_CLIENT_TOKEN = 'KAFKA_CLIENT_TOKEN';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(KafkaService.name);

  constructor(
    @Inject(KAFKA_CLIENT_TOKEN) private readonly client: ClientKafka,
  ) {}

  async onModuleInit() {
    this.logger.log('Connecting to Kafka...');
    await this.client.connect();
    this.logger.log('Connected to Kafka.');
  }

  async onModuleDestroy() {
    this.logger.log('Disconnecting from Kafka...');
    await this.client.close();
  }

  emit<TResult = any, TInput = any>(topic: string, data: TInput) {
    this.logger.debug(`Emitting message to topic ${topic}`);
    return this.client.emit<TResult, TInput>(topic, data);
  }

  send<TResult = any, TInput = any>(topic: string, data: TInput) {
    this.logger.debug(`Sending message to topic ${topic}`);
    return this.client.send<TResult, TInput>(topic, data);
  }
}
