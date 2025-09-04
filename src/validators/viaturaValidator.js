// Arquivo: backend/src/validators/viaturaValidator.js (Atualizado)

const Joi = require('joi');

const createViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'O prefixo é obrigatório.',
    'any.required': 'O prefixo é obrigatório.',
  }),
  ativa: Joi.boolean().optional().default(true),
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

const updateViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).optional(),
  ativa: Joi.boolean().optional(),
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

module.exports = {
  createViaturaSchema,
  updateViaturaSchema,
};
