import { INestApplication, ValidationPipe } from '@nestjs/common';

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

  return app;
}
