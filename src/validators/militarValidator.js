// Arquivo: backend/src/validators/militarValidator.js (Atualizado)

const Joi = require('joi');

const createMilitarSchema = Joi.object({
  matricula: Joi.string().min(3).max(20).required().messages({
    'string.empty': 'A matrícula é obrigatória.',
    'any.required': 'A matrícula é obrigatória.',
  }),
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome completo é obrigatório.',
    'any.required': 'O nome completo é obrigatório.',
  }),
  nome_guerra: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O nome de guerra é obrigatório.',
    'any.required': 'O nome de guerra é obrigatório.',
  }),
  posto_graduacao: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O posto/graduação é obrigatório.',
    'any.required': 'O posto/graduação é obrigatório.',
  }),
  ativo: Joi.boolean().required(),
  obm_id: Joi.number().integer().positive().required().messages({
    'number.base': 'A OBM é obrigatória.',
    'any.required': 'A OBM é obrigatória.',
  }),
});

const updateMilitarSchema = Joi.object({
  matricula: Joi.string().min(3).max(20).optional(),
  nome_completo: Joi.string().min(3).max(150).optional(),
  nome_guerra: Joi.string().min(2).max(50).optional(),
  posto_graduacao: Joi.string().min(2).max(50).optional(),
  ativo: Joi.boolean().optional(),
  obm_id: Joi.number().integer().positive().optional().allow(null),
});

module.exports = {
  createMilitarSchema,
  updateMilitarSchema,
};
