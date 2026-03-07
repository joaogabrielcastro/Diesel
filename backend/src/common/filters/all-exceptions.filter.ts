import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from "@nestjs/common";
import { Request, Response } from "express";

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = "Erro interno do servidor";
    let errors: any;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === "object") {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || exception.message;
        errors = responseObj.errors;

        // Traduz mensagens de validação para português
        if (Array.isArray(message)) {
          message = this.translateValidationMessages(message);
        }
      } else {
        message = exceptionResponse as string;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      this.logger.error(
        `Erro não tratado: ${exception.message}`,
        exception.stack,
      );
    }

    // Traduz mensagens comuns do sistema
    message = this.translateCommonMessages(message);

    const errorResponse = {
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
      method: request.method,
      message,
      ...(errors && { errors }),
    };

    // Log do erro em produção
    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url} - Status: ${status}`,
        JSON.stringify(errorResponse),
      );
    } else {
      this.logger.warn(
        `${request.method} ${request.url} - Status: ${status} - ${message}`,
      );
    }

    response.status(status).json(errorResponse);
  }

  private translateValidationMessages(messages: string[]): string {
    const translations: Record<string, string> = {
      "must be a string": "deve ser um texto",
      "must be a number": "deve ser um número",
      "must be an email": "deve ser um email válido",
      "should not be empty": "não pode estar vazio",
      "must be longer than or equal to": "deve ter no mínimo",
      "must be greater than or equal to": "deve ser maior ou igual a",
      "must be a valid enum value": "deve ser um valor válido",
      "must be a boolean": "deve ser verdadeiro ou falso",
    };

    return messages
      .map((msg) => {
        let translated = msg;
        Object.entries(translations).forEach(([key, value]) => {
          translated = translated.replace(new RegExp(key, "gi"), value);
        });
        return translated;
      })
      .join(", ");
  }

  private translateCommonMessages(message: string | string[]): string {
    let messageStr = Array.isArray(message) ? message.join(", ") : message;

    const commonTranslations: Record<string, string> = {
      Unauthorized: "Não autorizado. Faça login novamente.",
      Forbidden: "Você não tem permissão para acessar este recurso.",
      "Not Found": "Recurso não encontrado.",
      "Bad Request": "Requisição inválida.",
      "Internal Server Error": "Erro interno do servidor.",
      Conflict: "Conflito. Este recurso já existe.",
      "Too Many Requests": "Muitas requisições. Tente novamente mais tarde.",
      "Validation failed": "Validação falhou. Verifique os dados enviados.",
    };

    Object.entries(commonTranslations).forEach(([key, value]) => {
      if (messageStr.includes(key)) {
        messageStr = messageStr.replace(key, value);
      }
    });

    return messageStr;
  }
}
