const { Joi } = require('express-validation');

const baseSchema = {
  data: Joi.date().iso().required().messages({
    'date.base': 'A data da escala deve ser uma data valida.',
    'any.required': 'A data da escala e obrigatoria.',
  }),
  aeronave_id: Joi.number().integer().positive().optional(),
  aeronave_prefixo: Joi.string().optional(),
  primeiro_piloto_id: Joi.number().integer().positive().allow(null, ''),
  segundo_piloto_id: Joi.number().integer().positive().allow(null, ''),
  status: Joi.string().max(30).optional().default('Ativa'),
};

const createSchema = Joi.object({
  ...baseSchema,
  aeronave_id: baseSchema.aeronave_id.required().messages({
    'number.base': 'O id da aeronave deve ser um numero.',
    'any.required': 'O id da aeronave e obrigatorio.',
  }),
  aeronave_prefixo: baseSchema.aeronave_prefixo.allow(null, ''),
});

const updateSchema = Joi.object(baseSchema)
  .min(1)
  .messages({
    'object.min': 'Informe ao menos um campo para atualizar.',
  });

const escalaAeronaveValidator = {
  create: {
    body: createSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateSchema,
  },
  schemas: {
    create: createSchema,
    update: updateSchema,
  },
};

module.exports = escalaAeronaveValidator;
