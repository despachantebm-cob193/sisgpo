// src/validators/viaturaValidator.js

const Joi = require('joi');

// Schema para a CRIAÇÃO de uma nova viatura (simplificado)
const createViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).required(),
  obm_id: Joi.number().integer().positive().optional().allow(null),
  ativa: Joi.boolean().optional().default(true),
  // Campos de texto desnormalizados
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

// Schema para a ATUALIZAÇÃO de uma viatura (simplificado)
const updateViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).optional(),
  obm_id: Joi.number().integer().positive().optional().allow(null),
  ativa: Joi.boolean().optional(),
  // Campos de texto desnormalizados
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

module.exports = {
  createViaturaSchema,
  updateViaturaSchema,
};
