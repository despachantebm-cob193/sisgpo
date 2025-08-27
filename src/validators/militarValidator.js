const Joi = require('joi');

const createMilitarSchema = Joi.object({
  matricula: Joi.string().min(3).max(20).required(),
  nome_completo: Joi.string().min(3).max(150).required(),
  nome_guerra: Joi.string().min(2).max(50).required(),
  posto_graduacao: Joi.string().min(2).max(50).required(),
  ativo: Joi.boolean().required(),
  obm_id: Joi.number().integer().positive().required(),
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
