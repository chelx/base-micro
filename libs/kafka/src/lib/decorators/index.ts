import { applyDecorators } from '@nestjs/common';
import { EventPattern, MessagePattern } from '@nestjs/microservices';

/**
 * A custom decorator that combines standard Kafka routing with additional metadata.
 * Can be expanded to add retry logic, schema validation or tracing metadata.
 */
export function KafkaEventHandler(topic: string) {
  return applyDecorators(EventPattern(topic));
}

export function KafkaMessageHandler(topic: string) {
  return applyDecorators(MessagePattern(topic));
}
