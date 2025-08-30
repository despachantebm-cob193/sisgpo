// src/middlewares/errorMiddleware.js

const errorMiddleware = (error, req, res, next) => {
  // Loga o erro completo no console do servidor, o que é essencial para depuração
  console.error('ERRO CAPTURADO PELO MIDDLEWARE:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor.';

  res.status(statusCode).json({
    message,
    // Em ambiente de desenvolvimento, é útil enviar o stack do erro para o cliente.
    // Em produção, isso deve ser desativado por segurança.
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

module.exports = errorMiddleware;
