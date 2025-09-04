const AppError = require('../utils/AppError');

const validationMiddleware = (schema) => (req, res, next) => {
  // Se não houver schema definido na rota, é um erro do servidor.
  if (!schema) {
    throw new AppError('Schema de validação não fornecido para esta rota.', 500);
  }

  // Valida o corpo da requisição. A opção { abortEarly: false } garante que todos os erros sejam coletados.
  const { error } = schema.validate(req.body, { abortEarly: false });

  if (error) {
    // --- DIAGNÓSTICO E CORREÇÃO ---
    // Mapeia os detalhes do erro para um formato padronizado que o frontend pode usar.
    // Ex: { field: 'prefixo', message: 'O prefixo é obrigatório.' }
    const errors = error.details.map(detail => ({
      field: detail.context.key,
      message: detail.message.replace(/"/g, ''), // Remove aspas para uma mensagem mais limpa
    }));
    
    // Loga os erros no console do backend para depuração
    console.error('[Validation Error]', JSON.stringify(errors, null, 2));

    // Retorna o status 400 com a lista de erros de validação.
    return res.status(400).json({ 
      message: 'Erro de validação nos dados enviados.', 
      errors 
    });
  }

  // Se não houver erros, prossegue para o controller.
  next();
};

module.exports = validationMiddleware;
