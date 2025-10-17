const Joi = require('joi');

const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
const telefoneField = Joi.string()
  .pattern(telefoneRegex)
  .allow(null, '')
  .messages({
    'string.pattern.base': 'O telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.',
  });

const baseNomeMessages = {
  'string.empty': 'O nome do médico é obrigatório.',
  'any.required': 'O nome do médico é obrigatório.',
};

const baseFuncaoMessages = {
  'string.empty': 'A função é obrigatória.',
  'any.required': 'A função é obrigatória.',
};

const createCivilSchema = Joi.object({
  nome_completo: Joi.string().min(3).max(150).required().messages(baseNomeMessages),
  funcao: Joi.string().min(3).max(100).required().messages(baseFuncaoMessages),
  telefone: telefoneField,
  observacoes: Joi.string().allow(null, '').optional(),
  ativo: Joi.boolean().optional(),
});

const updateCivilSchema = Joi.object({
  nome_completo: Joi.string().min(3).max(150).optional(),
  funcao: Joi.string().min(3).max(100).optional(),
  telefone: telefoneField.optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  ativo: Joi.boolean().optional(),
  entrada_servico: Joi.date().iso().optional(),
  saida_servico: Joi.date().iso().optional(),
  status_servico: Joi.string().valid('Presente', 'Ausente').optional(),
}).options({ allowUnknown: true });

const createEscalaSchema = Joi.object({
  civil_id: Joi.number().integer().positive().optional(),
  nome_completo: Joi.when('civil_id', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.string().min(3).max(150).required().messages(baseNomeMessages),
  }),
  funcao: Joi.when('civil_id', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.string().min(3).max(100).required().messages(baseFuncaoMessages),
  }),
  telefone: Joi.when('civil_id', {
    is: Joi.exist(),
    then: telefoneField.optional(),
    otherwise: telefoneField,
  }),
  observacoes: Joi.string().allow(null, '').optional(),
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
  ativo: Joi.boolean().optional(),
}).or('civil_id', 'nome_completo');

const updateEscalaSchema = Joi.object({
  civil_id: Joi.number().integer().positive().optional(),
  nome_completo: Joi.string().min(3).max(150).optional(),
  funcao: Joi.string().min(3).max(100).optional(),
  telefone: telefoneField.optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  entrada_servico: Joi.date().iso().optional(),
  saida_servico: Joi.date().iso().optional(),
  status_servico: Joi.string().valid('Presente', 'Ausente').optional(),
  ativo: Joi.boolean().optional(),
}).options({ allowUnknown: true });

module.exports = {
  createCivilSchema,
  updateCivilSchema,
  createEscalaSchema,
  updateEscalaSchema,
};
