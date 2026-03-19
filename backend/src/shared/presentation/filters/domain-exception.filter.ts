import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpStatus,
} from '@nestjs/common';

import { DomainValidationError } from '../../../modules/simulations/domain/errors/domain-validation.error';
import { SimulationNotFoundError } from '../../../modules/simulations/domain/errors/simulation-not-found.error';

@Catch(DomainValidationError, SimulationNotFoundError)
export class DomainExceptionFilter implements ExceptionFilter {
  catch(
    exception: DomainValidationError | SimulationNotFoundError,
    host: ArgumentsHost,
  ): void {
    const response = host.switchToHttp().getResponse();

    if (exception instanceof SimulationNotFoundError) {
      response.status(HttpStatus.NOT_FOUND).json({
        statusCode: HttpStatus.NOT_FOUND,
        message: exception.message,
        error: 'Not Found',
      });
      return;
    }

    response.status(HttpStatus.BAD_REQUEST).json({
      statusCode: HttpStatus.BAD_REQUEST,
      message: exception.message,
      error: 'Bad Request',
    });
  }
}
