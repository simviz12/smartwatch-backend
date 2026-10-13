import { ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'yaml';
import { AppModule } from './app.module';
import { config } from './shared/config/config.service';
import { GlobalExceptionFilter } from './shared/errors/global-exception.filter';
import { PrivacyLogger } from './shared/logging/privacy-logger.service';

async function bootstrap() {
  const logger = new PrivacyLogger();
  const app = await NestFactory.create(AppModule, {
    logger,
  });

  // Global validation pipe with strict whitelist
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  // Global exception filter
  app.useGlobalFilters(new GlobalExceptionFilter());

  // Swagger Documentation configuration
  const swaggerConfig = new DocumentBuilder()
    .setTitle('Pulso API')
    .setDescription('Pulso Wellness & Emotional Support Chat API')
    .setVersion('0.1.0')
    .addTag('Health', 'System and database health diagnostics')
    .build();

  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, document);

  // Export openapi.yaml
  const yamlString = yaml.stringify(document);
  const openapiPath = path.resolve(process.cwd(), 'openapi.yaml');
  fs.writeFileSync(openapiPath, yamlString, 'utf8');

  // Listen on 0.0.0.0
  const port = config.PORT || 3000;
  await app.listen(port, '0.0.0.0');
  logger.log(`Pulso API is listening on http://0.0.0.0:${port}`);
  logger.log(`Swagger documentation available at http://0.0.0.0:${port}/docs`);
}

bootstrap();
