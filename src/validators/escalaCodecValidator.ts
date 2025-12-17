import { Joi } from 'express-validation';

export type EscalaCodecPlantonistaDTO = {
  militar_id: number;
  ordem_plantonista?: number;
};

export type EscalaCodecDTO = {
  data?: Date | string;
  diurno?: EscalaCodecPlantonistaDTO[];
  noturno?: EscalaCodecPlantonistaDTO[];
};

const plantonistaSchema = Joi.object<EscalaCodecPlantonistaDTO>({
  militar_id: Joi.number().integer().required(),
  ordem_plantonista: Joi.number().integer().min(1).optional(),
});

const createEscalaCodecSchema = Joi.object<EscalaCodecDTO>({
  data: Joi.date().required().messages({
    'any.required': 'A data e obrigatoria.',
  }),
  diurno: Joi.array().items(plantonistaSchema).optional(),
  noturno: Joi.array().items(plantonistaSchema).optional(),
}).options({ allowUnknown: true });

const updateEscalaCodecSchema = Joi.object<EscalaCodecDTO>({
  data: Joi.date().optional(),
  diurno: Joi.array().items(plantonistaSchema).optional(),
  noturno: Joi.array().items(plantonistaSchema).optional(),
})
  .min(1)
  .options({ allowUnknown: true });

const escalaCodecValidator = {
  create: {
    body: createEscalaCodecSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateEscalaCodecSchema,
  },
  schemas: {
    create: createEscalaCodecSchema,
    update: updateEscalaCodecSchema,
  },
};

export default escalaCodecValidator;
