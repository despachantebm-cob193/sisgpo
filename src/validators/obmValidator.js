const Joi = require('joi');

const createObmSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  abreviatura: Joi.string().min(2).max(20).required(),
  cidade: Joi.string().max(50).optional().allow(null, ''),
  ativo: Joi.boolean().optional().default(true),
});

const updateObmSchema = Joi.object({
  nome: Joi.string().min(3).max(100).optional(),
  abreviatura: Joi.string().min(2).max(20).optional(),
  cidade: Joi.string().max(50).optional().allow(null, ''),
  ativo: Joi.boolean().optional(),
});

module.exports = {
  createObmSchema,
  updateObmSchema,
};
