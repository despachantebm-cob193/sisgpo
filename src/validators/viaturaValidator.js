const Joi = require('joi');

// Schema para a CRIAÇÃO de uma nova viatura
const createViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).required(),
  placa: Joi.string().length(7).alphanum().uppercase().required(),
  modelo: Joi.string().max(100).optional().allow(null, ''),
  ano: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional().allow(null),
  tipo: Joi.string().min(2).max(50).required(),
  obm_id: Joi.number().integer().positive().required(),
  ativa: Joi.boolean().optional().default(true),
});

// Schema para a ATUALIZAÇÃO de uma viatura
const updateViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).optional(),
  placa: Joi.string().length(7).alphanum().uppercase().optional(),
  modelo: Joi.string().max(100).optional().allow(null, ''),
  ano: Joi.number().integer().min(1980).max(new Date().getFullYear() + 1).optional().allow(null),
  tipo: Joi.string().min(2).max(50).optional(),
  obm_id: Joi.number().integer().positive().optional().allow(null),
  ativa: Joi.boolean().required(), // 'ativa' é obrigatório na atualização
});

module.exports = {
  createViaturaSchema,
  updateViaturaSchema,
};
