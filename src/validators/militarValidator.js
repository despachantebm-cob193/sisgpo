// Arquivo: backend/src/validators/militarValidator.js (Atualizado)

const Joi = require('joi');

const baseSchema = {
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome completo é obrigatório.',
    'any.required': 'O nome completo é obrigatório.',
  }),
  nome_guerra: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O nome de guerra é obrigatório.',
    'any.required': 'O nome de guerra é obrigatório.',
  }),
  ativo: Joi.boolean().required(),
  obm_id: Joi.number().integer().positive().required().messages({
    'number.base': 'A OBM é obrigatória.',
    'any.required': 'A OBM é obrigatória.',
  }),
  // Novo campo 'tipo'
  tipo: Joi.string().valid('Militar', 'Civil').required().messages({
    'any.only': 'O tipo deve ser "Militar" ou "Civil".',
    'any.required': 'O tipo é obrigatório.',
  }),
};

const createMilitarSchema = Joi.object({
  ...baseSchema,
  // Validação condicional para matrícula e posto/graduação
  matricula: Joi.when('tipo', {
    is: 'Militar',
    then: Joi.string().min(3).max(20).required(),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  posto_graduacao: Joi.when('tipo', {
    is: 'Militar',
    then: Joi.string().min(2).max(50).required(),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
});

const updateMilitarSchema = Joi.object({
  ...baseSchema,
  matricula: Joi.when('tipo', {
    is: 'Militar',
    then: Joi.string().min(3).max(20).required(),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
  posto_graduacao: Joi.when('tipo', {
    is: 'Militar',
    then: Joi.string().min(2).max(50).required(),
    otherwise: Joi.string().optional().allow(null, ''),
  }),
}).options({ allowUnknown: true }); // Permite campos extras como 'id'

module.exports = {
  createMilitarSchema,
  updateMilitarSchema,
};
