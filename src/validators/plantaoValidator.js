// Arquivo: backend/src/validators/plantaoValidator.js (VERSÃO ATUALIZADA)

const Joi = require('joi');

const guarnicaoItemSchema = Joi.object({
  militar_id: Joi.number().integer().positive().required().messages({
    'number.base': 'O ID do militar deve ser um número.',
    'number.positive': 'O ID do militar deve ser um número positivo.',
    'any.required': 'O ID do militar é obrigatório.',
  }),
  funcao: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'A função do militar não pode estar vazia.',
    'any.required': 'A função do militar é obrigatória.',
  }),
  // Adiciona o campo telefone como opcional
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

const plantaoSchema = Joi.object({
  data_plantao: Joi.date().iso().required().messages({
    'date.base': 'A data do plantão deve ser uma data válida no formato ISO (YYYY-MM-DD).',
    'any.required': 'A data do plantão é obrigatória.',
  }),
  viatura_id: Joi.number().integer().positive().required().messages({
    'number.base': 'O ID da viatura deve ser um número.',
    'any.required': 'O ID da viatura é obrigatório.',
  }),
  obm_id: Joi.alternatives()
    .try(
      Joi.number().integer().positive(),
      Joi.string().trim().pattern(/^\d+$/)
    )
    .optional()
    .allow(null, '')
    .messages({
      'alternatives.match': 'O ID da OBM deve ser um número válido.',
    }),
  observacoes: Joi.string().optional().allow(null, ''),
  guarnicao: Joi.array().items(guarnicaoItemSchema).min(1).required().messages({
    'array.base': 'A guarnição deve ser uma lista de militares.',
    'array.min': 'A guarnição deve ter pelo menos {#limit} militar.',
    'any.required': 'A guarnição é obrigatória.',
  }),
});

module.exports = {
  plantaoSchema,
};
