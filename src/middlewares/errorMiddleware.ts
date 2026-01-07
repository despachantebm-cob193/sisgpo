import { ErrorRequestHandler } from 'express';
import { ValidationError } from 'express-validation';

const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('ERRO CAPTURADO PELO MIDDLEWARE:', error);

  // Tratamento específico para erros do express-validation (Joi)
  if (error instanceof ValidationError || (error?.error && error.error.isJoi)) {
    const details = (error as any)?.details || {};
    return res.status(400).json({
      message: 'Erro de validacao nos dados enviados.',
      details,
    });
  }

  const statusCode = (error as any)?.statusCode || 500;
  const message = (error as Error)?.message || 'Erro interno do servidor.';

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
  });
};

export = errorMiddleware;
