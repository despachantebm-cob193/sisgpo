const validationMiddleware = (schema) => (req, res, next) => {
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    const errors = error.details.map(detail => ({
      message: detail.message.replace(/"/g, '\''), // Remove aspas duplas da mensagem
      field: detail.context.key
    }));
    // Retorna 400 para erros de validação
    return res.status(400).json({ message: 'Erro de validação nos dados enviados.', errors });
  }
  next();
};

module.exports = validationMiddleware;
