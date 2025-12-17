import { Joi } from 'express-validation';

const createEscalaAeronaveSchema = Joi.object({
  data: Joi.date().required().messages({
    'any.required': 'A data e obrigatoria.',
  }),
  aeronave_id: Joi.number().integer().allow(null),
  aeronave_prefixo: Joi.string().allow(null, ''),
  primeiro_piloto_id: Joi.number().integer().allow(null),
  segundo_piloto_id: Joi.number().integer().allow(null),
  status: Joi.string().allow(null, ''),
}).options({ allowUnknown: true });

const updateEscalaAeronaveSchema = Joi.object({
  data: Joi.date(),
  aeronave_id: Joi.number().integer().allow(null),
  aeronave_prefixo: Joi.string().allow(null, ''),
  primeiro_piloto_id: Joi.number().integer().allow(null),
  segundo_piloto_id: Joi.number().integer().allow(null),
  status: Joi.string().allow(null, ''),
})
  .min(1)
  .options({ allowUnknown: true });

const escalaAeronaveValidator = {
  create: {
    body: createEscalaAeronaveSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateEscalaAeronaveSchema,
  },
  schemas: {
    create: createEscalaAeronaveSchema,
    update: updateEscalaAeronaveSchema,
  },
};

export = escalaAeronaveValidator;
