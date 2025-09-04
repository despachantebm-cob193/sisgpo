// Arquivo: backend/src/validators/obmValidator.js (Atualizado)

const Joi = require('joi');

const createObmSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required().messages({
    'string.base': "O campo 'nome' deve ser um texto.",
    'string.empty': "O campo 'nome' não pode estar vazio.",
    'string.min': "O campo 'nome' deve ter no mínimo {#limit} caracteres.",
    'string.max': "O campo 'nome' deve ter no máximo {#limit} caracteres.",
    'any.required': "O campo 'nome' é obrigatório.",
  }),
  abreviatura: Joi.string().min(2).max(20).required().messages({
    'string.base': "O campo 'abreviatura' deve ser um texto.",
    'string.empty': "O campo 'abreviatura' não pode estar vazio.",
    'string.min': "O campo 'abreviatura' deve ter no mínimo {#limit} caracteres.",
    'string.max': "O campo 'abreviatura' deve ter no máximo {#limit} caracteres.",
    'any.required': "O campo 'abreviatura' é obrigatório.",
  }),
  cidade: Joi.string().max(50).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

const updateObmSchema = Joi.object({
  nome: Joi.string().min(3).max(100).optional(),
  abreviatura: Joi.string().min(2).max(20).optional(),
  cidade: Joi.string().max(50).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

module.exports = {
  createObmSchema,
  updateObmSchema,
};
