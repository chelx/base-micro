import { DynamicModule, Module, Global } from '@nestjs/common';
import {
  ClientsModule,
  Transport,
  ClientsModuleOptions,
  ClientProviderOptions,
} from '@nestjs/microservices';
import { KafkaService, KAFKA_CLIENT_TOKEN } from './kafka.service';

export interface KafkaModuleOptions {
  clientId: string;
  brokers: string[];
  groupId?: string;
}

@Global()
@Module({})
export class KafkaModule {
  static register(options: KafkaModuleOptions): DynamicModule {
    const clientOptions: ClientProviderOptions = {
      name: KAFKA_CLIENT_TOKEN,
      transport: Transport.KAFKA,
      options: {
        client: {
          clientId: options.clientId,
          brokers: options.brokers,
        },
        consumer: {
          groupId: options.groupId || `${options.clientId}-group`,
        },
      },
    };

    return {
      module: KafkaModule,
      imports: [ClientsModule.register([clientOptions])],
      providers: [KafkaService],
      exports: [KafkaService],
    };
  }
}
