// Este middleware será nosso ponto central para tratamento de erros.
const errorMiddleware = (error, req, res, next) => {
  console.error('ERRO CAPTURADO PELO MIDDLEWARE:', error);

  const statusCode = error.statusCode || 500;
  const message = error.message || 'Erro interno do servidor.';

  res.status(statusCode).json({
    message,
    // Em ambiente de desenvolvimento, pode ser útil enviar o stack do erro.
    stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
  });
};

module.exports = errorMiddleware;
