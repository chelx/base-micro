import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export interface SwaggerConfig {
    title: string;
    description: string;
    version?: string;
    path?: string;
}

export function setupSwagger(app: INestApplication, config: SwaggerConfig) {
    const options = new DocumentBuilder()
        .setTitle(config.title)
        .setDescription(config.description)
        .setVersion(config.version || '1.0')
        .addBearerAuth()
        .build();

    const document = SwaggerModule.createDocument(app, options);

    // Serve Swagger UI at /api/docs (relative to global prefix if set)
    // or at /docs if no prefix.
    SwaggerModule.setup(config.path || 'docs', app, document);
}
