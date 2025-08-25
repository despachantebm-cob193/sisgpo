const Joi = require('joi');

// Schema para a criação de uma nova OBM
const createObmSchema = Joi.object({
  nome: Joi.string().min(5).max(255).required().messages({
    'string.base': 'O campo nome deve ser um texto.',
    'string.empty': 'O campo nome não pode estar vazio.',
    'string.min': 'O nome deve ter no mínimo {#limit} caracteres.',
    'any.required': 'O campo nome é obrigatório.',
  }),
  abreviatura: Joi.string().min(2).max(50).required().messages({
    'string.base': 'O campo abreviatura deve ser um texto.',
    'string.empty': 'O campo abreviatura não pode estar vazio.',
    'string.min': 'A abreviatura deve ter no mínimo {#limit} caracteres.',
    'any.required': 'O campo abreviatura é obrigatório.',
  }),
  cidade: Joi.string().max(100).optional().allow(null, '').messages({
    'string.base': 'O campo cidade deve ser um texto.',
  }),
});

// Schema para a atualização de uma OBM existente
const updateObmSchema = Joi.object({
  nome: Joi.string().min(5).max(255).required(),
  abreviatura: Joi.string().min(2).max(50).required(),
  cidade: Joi.string().max(100).optional().allow(null, ''),
  ativo: Joi.boolean().required().messages({
    'boolean.base': 'O campo ativo deve ser um valor booleano (true ou false).',
    'any.required': 'O campo ativo é obrigatório na atualização.',
  }),
});

module.exports = {
  createObmSchema,
  updateObmSchema,
};
