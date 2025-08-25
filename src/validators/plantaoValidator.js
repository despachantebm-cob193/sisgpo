const Joi = require('joi');

// Schema para um item individual da guarnição
const guarnicaoItemSchema = Joi.object({
  militar_id: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo "militar_id" é obrigatório para cada membro da guarnição.',
    'number.base': 'O "militar_id" deve ser um número.',
  }),
  funcao: Joi.string().min(3).max(50).required().messages({
    'any.required': 'O campo "funcao" é obrigatório para cada membro da guarnição.',
    'string.empty': 'O campo "funcao" não pode estar vazio.',
  }),
});

// Schema para a criação de um novo plantão
const createPlantaoSchema = Joi.object({
  data_plantao: Joi.date().iso().required().messages({
    'any.required': 'O campo data_plantao é obrigatório.',
    'date.format': 'O campo data_plantao deve estar no formato ISO 8601 (YYYY-MM-DD).',
  }),
  viatura_id: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo viatura_id é obrigatório.',
  }),
  obm_id: Joi.number().integer().positive().required().messages({
    'any.required': 'O campo obm_id é obrigatório.',
  }),
  observacoes: Joi.string().optional().allow(null, ''),
  guarnicao: Joi.array().items(guarnicaoItemSchema).min(1).required().messages({
    'any.required': 'O campo guarnicao é obrigatório.',
    'array.min': 'A guarnição deve ter pelo menos {#limit} militar.',
    'array.base': 'A guarnição deve ser uma lista (array).',
  }),
});

// Schema para a atualização de um plantão (geralmente as mesmas regras da criação)
const updatePlantaoSchema = createPlantaoSchema; // Reutilizando o mesmo schema

module.exports = {
  createPlantaoSchema,
  updatePlantaoSchema,
};
