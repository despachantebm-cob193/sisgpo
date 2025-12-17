import { Joi } from 'express-validation';

export type CreateAeronaveDTO = {
  prefixo: string;
  tipo_asa: 'fixa' | 'rotativa';
  ativa?: boolean;
};

export type UpdateAeronaveDTO = Partial<CreateAeronaveDTO>;

const createAeronaveSchema = Joi.object<CreateAeronaveDTO>({
  prefixo: Joi.string().trim().min(2).max(50).required().messages({
    'string.empty': 'O prefixo e obrigatorio.',
    'any.required': 'O prefixo e obrigatorio.',
  }),
  tipo_asa: Joi.string().trim().valid('fixa', 'rotativa').required().messages({
    'any.only': 'O tipo de asa deve ser fixa ou rotativa.',
    'any.required': 'O tipo de asa e obrigatorio.',
  }),
  ativa: Joi.boolean().optional(),
}).options({ allowUnknown: true });

const updateAeronaveSchema = Joi.object<UpdateAeronaveDTO>({
  prefixo: Joi.string().trim().min(2).max(50),
  tipo_asa: Joi.string().trim().valid('fixa', 'rotativa'),
  ativa: Joi.boolean(),
})
  .min(1)
  .options({ allowUnknown: true });

const aeronaveValidator = {
  create: {
    body: createAeronaveSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateAeronaveSchema,
  },
  schemas: {
    create: createAeronaveSchema,
    update: updateAeronaveSchema,
  },
};

export default aeronaveValidator;
