import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  Injectable,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { PinoLogger } from 'nestjs-pino';
import { CORRELATION_ID_HEADER } from 'src/shared/constants/correlation-id';
import {
  buildApiErrorPayload,
  extractFromHttpExceptionBody,
  payloadFromUnknownException,
} from 'src/shared/helpers/api-error-response';

@Catch()
@Injectable()
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly logger: PinoLogger) {
    this.logger.setContext(AllExceptionsFilter.name);
  }

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') return;
    const httpCtx = host.switchToHttp();
    const req = httpCtx.getRequest<Request>();
    const res = httpCtx.getResponse<Response>();

    const ctx = {
      requestId: (req.headers[CORRELATION_ID_HEADER] as string) ?? '',
      path: req.url,
    };

    // http exceptions (NotFoundException, BadRequestException...)
    if (exception instanceof HttpException) {
      const statusCode = exception.getStatus();
      const rawErrorResponse = exception.getResponse();

      if (typeof rawErrorResponse === 'string') {
        res
          .status(statusCode)
          .json(
            buildApiErrorPayload(statusCode, rawErrorResponse, undefined, ctx),
          );
        return;
      }

      //resBody is an object
      const { message, error } = extractFromHttpExceptionBody(
        rawErrorResponse,
        exception.message,
      );

      res
        .status(statusCode)
        .json(buildApiErrorPayload(statusCode, message, error, ctx));

      return;
    }

    // unknow exceptions (database errors, 500 server errors...)
    this.logger.error({
      msg: 'unhandled.exception',
      requestId: ctx.requestId,
      path: ctx.path,
      error:
        exception instanceof Error ? exception.message : 'Unknown exception',
      stack: exception instanceof Error ? exception.stack : undefined,
    });

    const payload = payloadFromUnknownException(exception, ctx);
    res.status(payload.statusCode).json(payload);
    return;
  }
}
