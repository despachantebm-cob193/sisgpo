import { Joi } from 'express-validation';

export type CreateViaturaDTO = {
  prefixo: string;
  ativa?: boolean;
  cidade?: string | null;
  obm?: string | null;
  telefone?: string | null;
};

export type UpdateViaturaDTO = Partial<CreateViaturaDTO>;

const createViaturaSchema = Joi.object<CreateViaturaDTO>({
  prefixo: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'O prefixo nao pode ser vazio.',
    'any.required': 'O prefixo e obrigatorio.',
  }),
  ativa: Joi.boolean().optional().default(true),
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
}).options({ allowUnknown: true });

const updateViaturaSchema = Joi.object<UpdateViaturaDTO>({
  prefixo: Joi.string().min(3).max(50).optional(),
  ativa: Joi.boolean().optional(),
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
})
  .min(1)
  .options({ allowUnknown: true });

const viaturaValidator = {
  create: {
    body: createViaturaSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateViaturaSchema,
  },
  schemas: {
    create: createViaturaSchema,
    update: updateViaturaSchema,
  },
};

export default viaturaValidator;
