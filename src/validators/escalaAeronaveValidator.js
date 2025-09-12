// Arquivo: src/validators/escalaAeronaveValidator.js

const Joi = require('joi');

const createEscalaAeronaveSchema = Joi.object({
  data: Joi.date().iso().required().messages({
    'date.base': 'A data da escala deve ser uma data válida.',
    'any.required': 'A data da escala é obrigatória.',
  }),
  aeronave_id: Joi.number().integer().positive().required().messages({
    'number.base': 'O ID da aeronave é obrigatório.',
    'any.required': 'O ID da aeronave é obrigatório.',
  }),
  // Adicionado para receber o prefixo do formulário
  aeronave_prefixo: Joi.string().required(),
  primeiro_piloto_id: Joi.number().integer().positive().allow(null, ''),
  segundo_piloto_id: Joi.number().integer().positive().allow(null, ''),
  status: Joi.string().max(30).optional().default('Ativa'),
});

module.exports = {
  createEscalaAeronaveSchema,
};
