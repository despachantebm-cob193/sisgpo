// Arquivo: backend/src/validators/plantaoValidator.js

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
  obm_id: Joi.number().integer().positive().required().messages({
    'number.base': 'O ID da OBM deve ser um número.',
    'any.required': 'O ID da OBM é obrigatório.',
  }),
  observacoes: Joi.string().optional().allow(null, '').messages({
    'string.base': 'As observações devem ser um texto.',
  }),
  guarnicao: Joi.array().items(guarnicaoItemSchema).min(1).required().messages({
    'array.base': 'A guarnição deve ser uma lista de militares.',
    'array.min': 'A guarnição deve ter pelo menos {#limit} militar.',
    'any.required': 'A guarnição é obrigatória.',
  }),
});

module.exports = {
  plantaoSchema,
};
