const Joi = require('joi');

// Schema para a criação de um novo militar
const createMilitarSchema = Joi.object({
  nome_guerra: Joi.string().min(3).max(100).required().messages({
    'string.base': 'O campo nome_guerra deve ser um texto.',
    'string.empty': 'O campo nome_guerra não pode estar vazio.',
    'string.min': 'O nome de guerra deve ter no mínimo {#limit} caracteres.',
    'any.required': 'O campo nome_guerra é obrigatório.',
  }),
  matricula: Joi.string().pattern(/^[0-9]+$/).min(5).max(20).required().messages({
    'string.base': 'A matrícula deve ser um texto contendo apenas números.',
    'string.empty': 'O campo matrícula não pode estar vazio.',
    'string.pattern.base': 'A matrícula deve conter apenas números.',
    'string.min': 'A matrícula deve ter no mínimo {#limit} caracteres.',
    'any.required': 'O campo matrícula é obrigatório.',
  }),
  posto_graduacao: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O campo posto_graduacao não pode estar vazio.',
    'any.required': 'O campo posto_graduacao é obrigatório.',
  }),
  obm_id: Joi.number().integer().positive().optional().allow(null).messages({
    'number.base': 'O campo obm_id deve ser um número inteiro.',
    'number.positive': 'O campo obm_id deve ser um número positivo.',
  }),
});

// Schema para a atualização de um militar existente
const updateMilitarSchema = Joi.object({
  nome_guerra: Joi.string().min(3).max(100).required(),
  matricula: Joi.string().pattern(/^[0-9]+$/).min(5).max(20).required(),
  posto_graduacao: Joi.string().min(2).max(50).required(),
  obm_id: Joi.number().integer().positive().optional().allow(null),
  ativo: Joi.boolean().required().messages({
    'boolean.base': 'O campo ativo deve ser um valor booleano (true ou false).',
    'any.required': 'O campo ativo é obrigatório na atualização.',
  }),
});

module.exports = {
  createMilitarSchema,
  updateMilitarSchema,
};
