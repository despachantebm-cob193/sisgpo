import { Joi } from 'express-validation';

export type EscalaAeronaveDTO = {
  data?: Date | string;
  aeronave_id?: number | null;
  aeronave_prefixo?: string | null;
  primeiro_piloto_id?: number | null;
  segundo_piloto_id?: number | null;
  status?: string | null;
};

const createEscalaAeronaveSchema = Joi.object<EscalaAeronaveDTO>({
  data: Joi.date().required().messages({
    'any.required': 'A data e obrigatoria.',
  }),
  aeronave_id: Joi.number().integer().allow(null),
  aeronave_prefixo: Joi.string().allow(null, ''),
  primeiro_piloto_id: Joi.number().integer().allow(null),
  segundo_piloto_id: Joi.number().integer().allow(null),
  status: Joi.string().allow(null, ''),
}).options({ allowUnknown: true });

const updateEscalaAeronaveSchema = Joi.object<EscalaAeronaveDTO>({
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

export default escalaAeronaveValidator;
