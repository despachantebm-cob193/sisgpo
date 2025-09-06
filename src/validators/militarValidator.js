const Joi = require('joi');

// Schema base para criação e atualização, agora simplificado.
const militarSchema = {
  // Campos que agora são sempre obrigatórios
  matricula: Joi.string().min(3).max(20).required().messages({
    'string.empty': 'A matrícula é obrigatória.',
    'any.required': 'A matrícula é obrigatória.',
  }),
  posto_graduacao: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O posto/graduação é obrigatório.',
    'any.required': 'O posto/graduação é obrigatório.',
  }),

  // Campos que já eram obrigatórios
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome completo é obrigatório.',
    'any.required': 'O nome completo é obrigatório.',
  }),
  obm_id: Joi.number().integer().positive().required().messages({
    'number.base': 'A OBM é obrigatória.',
    'any.required': 'A OBM é obrigatória.',
  }),
  ativo: Joi.boolean().required(),

  // Nome de guerra agora é opcional
  nome_guerra: Joi.string().min(2).max(50).optional().allow(null, ''),
};

const createMilitarSchema = Joi.object(militarSchema);

const updateMilitarSchema = Joi.object(militarSchema).options({ allowUnknown: true });

module.exports = {
  createMilitarSchema,
  updateMilitarSchema,
};
