const Joi = require('joi');

const militarSchema = {
  matricula: Joi.string().min(1).max(20).required().messages({
    'string.empty': 'A matrícula é obrigatória.',
    'any.required': 'A matrícula é obrigatória.',
  }),
  posto_graduacao: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O posto/graduação é obrigatório.',
    'any.required': 'O posto/graduação é obrigatório.',
  }),
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome completo é obrigatório.',
    'any.required': 'O nome completo é obrigatório.',
  }),
  obm_nome: Joi.string().max(150).optional().allow(null, ''),
  ativo: Joi.boolean().required(),
  nome_guerra: Joi.string().max(50).optional().allow(null, ''),
};

const createMilitarSchema = Joi.object(militarSchema);
const updateMilitarSchema = Joi.object(militarSchema).options({ allowUnknown: true });

module.exports = {
  createMilitarSchema,
  updateMilitarSchema,
};
