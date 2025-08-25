const Joi = require('joi');

// Schema para a criação de uma nova viatura
const createViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'O campo prefixo não pode estar vazio.',
    'any.required': 'O campo prefixo é obrigatório.',
  }),
  placa: Joi.string().length(7).alphanum().uppercase().required().messages({
    'string.length': 'A placa deve ter exatamente {#limit} caracteres.',
    'string.alphanum': 'A placa deve conter apenas letras e números.',
    'any.required': 'O campo placa é obrigatório.',
  }),
  modelo: Joi.string().max(100).optional().allow(null, ''),
  ano: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional().allow(null),
  tipo: Joi.string().min(3).max(50).required().messages({
    'any.required': 'O campo tipo é obrigatório.',
  }),
  obm_id: Joi.number().integer().positive().optional().allow(null),
});

// Schema para a atualização de uma viatura existente
const updateViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).required(),
  placa: Joi.string().length(7).alphanum().uppercase().required(),
  modelo: Joi.string().max(100).optional().allow(null, ''),
  ano: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional().allow(null),
  tipo: Joi.string().min(3).max(50).required(),
  obm_id: Joi.number().integer().positive().optional().allow(null),
  ativa: Joi.boolean().required().messages({
    'boolean.base': 'O campo ativa deve ser um valor booleano (true ou false).',
    'any.required': 'O campo ativa é obrigatório na atualização.',
  }),
});

module.exports = {
  createViaturaSchema,
  updateViaturaSchema,
};
