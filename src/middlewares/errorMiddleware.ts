import { ErrorRequestHandler } from 'express';

const errorMiddleware: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('ERRO CAPTURADO PELO MIDDLEWARE:', error);

  const statusCode = (error as any)?.statusCode || 500;
  const message = (error as Error)?.message || 'Erro interno do servidor.';

  res.status(statusCode).json({
    message,
    stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined,
  });
};

export = errorMiddleware;
