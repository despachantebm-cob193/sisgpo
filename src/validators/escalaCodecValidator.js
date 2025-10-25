const { Joi } = require('express-validation');

const plantonistaSchema = Joi.object({
  militar_id: Joi.number().integer().positive().required().messages({
    'number.base': 'O id do militar deve ser um numero.',
    'any.required': 'Selecione um militar para a escala.',
  }),
  ordem_plantonista: Joi.number().integer().positive().optional(),
});

const baseSchema = {
  data: Joi.date().iso().required().messages({
    'date.base': 'A data da escala deve ser uma data valida.',
    'any.required': 'A data da escala e obrigatoria.',
  }),
  diurno: Joi.array().items(plantonistaSchema).optional().default([]),
  noturno: Joi.array().items(plantonistaSchema).optional().default([]),
};

const createSchema = Joi.object({
  ...baseSchema,
  diurno: baseSchema.diurno.required(),
  noturno: baseSchema.noturno.required(),
});

const updateSchema = Joi.object(baseSchema).min(1).messages({
  'object.min': 'Informe ao menos um campo para atualizar.',
});

const escalaCodecValidator = {
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

module.exports = escalaCodecValidator;
