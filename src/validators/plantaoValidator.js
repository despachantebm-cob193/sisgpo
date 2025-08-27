const Joi = require('joi');

const guarnicaoItemSchema = Joi.object({
  militar_id: Joi.number().integer().positive().required(),
  funcao: Joi.string().min(3).max(50).required(),
});

const plantaoSchema = Joi.object({
  data_plantao: Joi.date().iso().required(),
  viatura_id: Joi.number().integer().positive().required(),
  obm_id: Joi.number().integer().positive().required(),
  observacoes: Joi.string().optional().allow(null, ''),
  guarnicao: Joi.array().items(guarnicaoItemSchema).min(1).required(),
});

// Exporta o schema diretamente para ser usado nas rotas
module.exports = {
    plantaoSchema
};
