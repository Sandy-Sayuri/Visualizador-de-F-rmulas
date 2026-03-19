import { INestApplication, ValidationPipe } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

import { DomainExceptionFilter } from './shared/presentation/filters/domain-exception.filter';

export function configureApp(app: INestApplication): INestApplication {
  app.enableCors();
  app.setGlobalPrefix('api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
    }),
  );
  app.useGlobalFilters(new DomainExceptionFilter());
  const swaggerConfig = new DocumentBuilder()
    .setTitle('OrbitLab API')
    .setDescription(
      'API REST do OrbitLab para gerenciamento de simulacoes e corpos celestes.',
    )
    .setVersion('1.0.0')
    .addTag('Simulations', 'Operacoes de simulacoes persistidas no backend')
    .build();

  const swaggerDocument = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('docs', app, swaggerDocument, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
  });

  return app;
}
