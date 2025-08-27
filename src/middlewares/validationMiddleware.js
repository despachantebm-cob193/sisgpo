const AppError = require('../utils/AppError');

const validationMiddleware = (schema) => (req, res, next) => {
  // Verifica se um schema foi fornecido. Se não, lança um erro de servidor.
  if (!schema) {
    throw new AppError('Schema de validação não fornecido para esta rota.', 500);
  }

  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => ({
      message: detail.message.replace(/"/g, "'"),
      field: detail.context.key,
    }));
    // Retorna 400 (Bad Request) para erros de validação do cliente
    return res.status(400).json({ message: 'Erro de validação nos dados enviados.', errors });
  }

  next();
};

module.exports = validationMiddleware;
