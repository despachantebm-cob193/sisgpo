const Joi = require('joi');

const createCivilSchema = Joi.object({
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome completo é obrigatório.',
    'any.required': 'O nome completo é obrigatório.',
  }),
  apelido: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O apelido é obrigatório.',
    'any.required': 'O apelido é obrigatório.',
  }),
  ativo: Joi.boolean().required(),
  obm_id: Joi.number().integer().positive().required().messages({
    'number.base': 'A OBM é obrigatória.',
    'any.required': 'A OBM é obrigatória.',
  }),
});

const updateCivilSchema = Joi.object({
  nome_completo: Joi.string().min(3).max(150).optional(),
  apelido: Joi.string().min(2).max(50).optional(),
  ativo: Joi.boolean().optional(),
  obm_id: Joi.number().integer().positive().optional(),
}).options({ allowUnknown: true }); // Permite campos extras como 'id'

module.exports = {
  createCivilSchema,
  updateCivilSchema,
};
