const validationMiddleware = (schema) => async (req, res, next) => {
  try {
    // Valida o corpo da requisição contra o schema fornecido
    await schema.validateAsync(req.body, {
      abortEarly: false, // Retorna todos os erros de validação, não apenas o primeiro
      stripUnknown: true, // Remove campos desconhecidos que não estão no schema
    });
    // Se a validação for bem-sucedida, passa para o próximo middleware (ou controller)
    next();
  } catch (error) {
    // Se a validação falhar, o Joi gera um erro com detalhes
    if (error.isJoi) {
      // Formata os erros para uma resposta clara e útil para o cliente
      const formattedErrors = error.details.map(detail => ({
        message: detail.message.replace(/"/g, "'"), // Melhora a legibilidade da mensagem
        field: detail.context.key,
      }));
      return res.status(400).json({
        message: 'Erro de validação nos dados enviados.',
        errors: formattedErrors,
      });
    }
    // Para erros inesperados, passa para o próximo tratador de erros
    next(error);
  }
};

module.exports = validationMiddleware;
