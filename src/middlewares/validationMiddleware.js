// Arquivo: backend/src/middlewares/validationMiddleware.js (Atualizado)

const AppError = require('../utils/AppError');

const validationMiddleware = (schema) => (req, res, next) => {
  if (!schema) {
    // Este é um erro de servidor, pois o schema deveria ter sido fornecido na rota.
    throw new AppError('Schema de validação não fornecido para esta rota.', 500);
  }

  // A opção { abortEarly: false } garante que todas as validações sejam executadas.
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    // Mapeia os detalhes do erro para um formato mais amigável para o frontend.
    const errors = error.details.map(detail => ({
      message: detail.message, // A mensagem já vem customizada do schema.
      field: detail.context.key,
    }));
    
    // Retorna 400 (Bad Request) com a lista de todos os erros de validação.
    return res.status(400).json({ message: 'Erro de validação nos dados enviados.', errors });
  }

  // Se não houver erros, prossegue para o próximo middleware (o controller).
  next();
};

module.exports = validationMiddleware;
