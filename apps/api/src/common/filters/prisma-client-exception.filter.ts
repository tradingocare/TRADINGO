import { ExceptionFilter, Catch, ArgumentsHost, HttpStatus, Logger } from '@nestjs/common';
import { FastifyReply, FastifyRequest } from 'fastify';
import { Prisma } from '@prisma/client';

@Catch(Prisma.PrismaClientKnownRequestError, Prisma.PrismaClientValidationError)
export class PrismaClientExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<FastifyReply>();
    const request = ctx.getRequest<FastifyRequest>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Database error';

    if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2002':
          status = HttpStatus.CONFLICT;
          const target = (exception.meta?.target as string[])?.join(', ') || 'field';
          message = `Resource with this ${target} already exists`;
          break;
        case 'P2025':
          status = HttpStatus.NOT_FOUND;
          message = exception.message?.split('\n').pop() || 'Resource not found';
          break;
        case 'P2003':
        case 'P2014':
          status = HttpStatus.CONFLICT;
          message = 'Referenced resource not found or constraint violation';
          break;
        case 'P2006':
        case 'P2011':
          status = HttpStatus.BAD_REQUEST;
          message = 'Invalid data provided';
          break;
        case 'P2024':
          status = HttpStatus.TOO_MANY_REQUESTS;
          message = 'Database connection pool exhausted, try again later';
          break;
        case 'P1001':
        case 'P1008':
          status = HttpStatus.SERVICE_UNAVAILABLE;
          message = 'Database server unavailable';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = 'Unexpected database error';
          break;
      }
    } else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Invalid query parameters';
    }

    this.logger.warn(`Prisma error: code=${(exception as any)?.code} status=${status} path=${request.url}`);

    response.status(status).send({
      statusCode: status,
      message,
      timestamp: new Date().toISOString(),
      path: request.url,
    });
  }
}
