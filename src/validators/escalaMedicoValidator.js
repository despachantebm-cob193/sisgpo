// Arquivo: src/validators/escalaMedicoValidator.js

const Joi = require('joi');

// Schema para criar um novo registro na escala
const createEscalaSchema = Joi.object({
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome do médico é obrigatório.',
    'any.required': 'O nome do médico é obrigatório.',
  }),
  funcao: Joi.string().min(3).max(100).required().messages({
    'string.empty': 'A função é obrigatória.',
    'any.required': 'A função é obrigatória.',
  }),
  entrada_servico: Joi.date().iso().required().messages({
    'date.base': 'A data/hora de entrada deve ser uma data válida.',
    'any.required': 'A data/hora de entrada é obrigatória.',
  }),
  saida_servico: Joi.date().iso().required().messages({
    'date.base': 'A data/hora de saída deve ser uma data válida.',
    'any.required': 'A data/hora de saída é obrigatória.',
  }),
  status_servico: Joi.string().valid('Presente', 'Ausente').required().messages({
    'any.only': 'O status deve ser "Presente" ou "Ausente".',
    'any.required': 'O status é obrigatório.',
  }),
  observacoes: Joi.string().optional().allow(null, ''),
  ativo: Joi.boolean().optional().default(true),
});

// Schema para atualizar um registro existente
const updateEscalaSchema = Joi.object({
  nome_completo: Joi.string().min(3).max(150).optional(),
  funcao: Joi.string().min(3).max(100).optional(),
  entrada_servico: Joi.date().iso().optional(),
  saida_servico: Joi.date().iso().optional(),
  status_servico: Joi.string().valid('Presente', 'Ausente').optional(),
  observacoes: Joi.string().optional().allow(null, ''),
  ativo: Joi.boolean().optional(),
}).options({ allowUnknown: true }); // Permite campos extras como 'id'

module.exports = {
  createEscalaSchema,
  updateEscalaSchema,
};
