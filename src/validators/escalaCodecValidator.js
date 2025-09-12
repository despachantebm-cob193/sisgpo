// Arquivo: src/validators/escalaCodecValidator.js (VERSÃO CORRIGIDA)

const Joi = require('joi');

// Schema para um item individual de plantonista
const plantonistaSchema = Joi.object({
  militar_id: Joi.number().integer().positive().required().allow(null),
  ordem: Joi.number().integer().positive().required(),
});

// Schema principal para o formulário
const createEscalaCodecSchema = Joi.object({
  data: Joi.date().iso().required().messages({
    'date.base': 'A data da escala deve ser uma data válida.',
    'any.required': 'A data da escala é obrigatória.',
  }),
  diurno: Joi.array().items(plantonistaSchema).required(),
  noturno: Joi.array().items(plantonistaSchema).required(),
});

module.exports = {
  createEscalaCodecSchema,
};
