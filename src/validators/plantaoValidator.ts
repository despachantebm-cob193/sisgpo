import { Joi } from 'express-validation';

const plantaoSchema = Joi.object({
  nome: Joi.string().required().messages({
    'string.empty': 'O nome do plantao e obrigatorio.',
    'any.required': 'O nome do plantao e obrigatorio.',
  }),
  tipo: Joi.string().required().messages({
    'string.empty': 'O tipo do plantao e obrigatorio.',
    'any.required': 'O tipo do plantao e obrigatorio.',
  }),
  periodo: Joi.string().allow(null, ''),
  responsavel: Joi.string().allow(null, ''),
  data_inicio: Joi.date().required(),
  data_fim: Joi.date().required(),
  data_plantao: Joi.date().optional(),
  ativo: Joi.boolean().optional(),
  observacoes: Joi.string().allow(null, ''),
  hora_inicio: Joi.string().allow(null, ''),
  hora_fim: Joi.string().allow(null, ''),
  viatura_id: Joi.number().integer().optional(),
  obm_id: Joi.number().integer().optional(),
});

const plantaoValidator = {
  create: {
    body: plantaoSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: plantaoSchema.min(1),
  },
  schemas: {
    plantao: plantaoSchema,
  },
};

export = plantaoValidator;
