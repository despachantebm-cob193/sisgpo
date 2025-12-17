import { Joi } from 'express-validation';

const baseFields = {
  nome_completo: Joi.string().trim().min(3).max(150).required().messages({
    'string.empty': 'O nome completo e obrigatorio.',
    'any.required': 'O nome completo e obrigatorio.',
  }),
  funcao: Joi.string().trim().max(100).required().messages({
    'string.empty': 'A funcao e obrigatoria.',
    'any.required': 'A funcao e obrigatoria.',
  }),
  telefone: Joi.string().allow(null, ''),
  observacoes: Joi.string().allow(null, ''),
  ativo: Joi.boolean().optional(),
  entrada_servico: Joi.date().optional(),
  saida_servico: Joi.date().optional(),
  status_servico: Joi.string().allow(null, ''),
};

const createEscalaMedicoSchema = Joi.object(baseFields).options({ allowUnknown: true });

const updateEscalaMedicoSchema = Joi.object(baseFields)
  .min(1)
  .options({ allowUnknown: true });

const escalaMedicoValidator = {
  create: {
    body: createEscalaMedicoSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateEscalaMedicoSchema,
  },
  schemas: {
    create: createEscalaMedicoSchema,
    update: updateEscalaMedicoSchema,
  },
};

export = escalaMedicoValidator;
