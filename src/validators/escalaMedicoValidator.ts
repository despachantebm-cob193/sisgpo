import { Joi } from 'express-validation';

export type EscalaMedicoDTO = {
  nome_completo: string;
  funcao: string;
  telefone?: string | null;
  observacoes?: string | null;
  ativo?: boolean;
  entrada_servico?: Date | string;
  saida_servico?: Date | string;
  status_servico?: string | null;
};

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

const createEscalaMedicoSchema = Joi.object<EscalaMedicoDTO>(baseFields).options({ allowUnknown: true });

// Validador para criação de ESCALA (aceita civil_id OU nome_completo+funcao)
const createEscalaSchema = Joi.object({
  civil_id: Joi.number().integer().positive().optional(),
  nome_completo: Joi.string().trim().min(3).max(150).optional(),
  funcao: Joi.string().trim().max(100).optional(),
  telefone: Joi.string().allow(null, ''),
  observacoes: Joi.string().allow(null, ''),
  ativo: Joi.boolean().optional(),
  entrada_servico: Joi.date().required().messages({
    'any.required': 'A data/hora de entrada é obrigatória.',
  }),
  saida_servico: Joi.date().required().messages({
    'any.required': 'A data/hora de saída é obrigatória.',
  }),
  status_servico: Joi.string().valid('Presente', 'Ausente').optional(),
}).options({ allowUnknown: true });

const updateEscalaMedicoSchema = Joi.object<EscalaMedicoDTO>(baseFields)
  .min(1)
  .options({ allowUnknown: true });

const escalaMedicoValidator = {
  create: {
    body: createEscalaMedicoSchema,
  },
  createEscala: {
    body: createEscalaSchema,
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

export default escalaMedicoValidator;
