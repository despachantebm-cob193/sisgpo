const { Joi } = require('express-validation');

const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;
const telefoneField = Joi.string()
  .pattern(telefoneRegex)
  .allow(null, '')
  .messages({
    'string.pattern.base': 'O telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.',
  });

const civilBaseSchema = {
  nome_completo: Joi.string().min(3).max(150),
  funcao: Joi.string().min(3).max(100),
  telefone: telefoneField.optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  ativo: Joi.boolean().optional(),
  entrada_servico: Joi.date().iso().optional(),
  saida_servico: Joi.date().iso().optional(),
  status_servico: Joi.string().valid('Presente', 'Ausente').optional(),
};

const createCivilSchema = Joi.object({
  ...civilBaseSchema,
  nome_completo: civilBaseSchema.nome_completo.required().messages({
    'string.empty': 'O nome do medico e obrigatorio.',
    'any.required': 'O nome do medico e obrigatorio.',
  }),
  funcao: civilBaseSchema.funcao.required().messages({
    'string.empty': 'A funcao e obrigatoria.',
    'any.required': 'A funcao e obrigatoria.',
  }),
}).options({ allowUnknown: false });

const updateCivilSchema = Joi.object(civilBaseSchema)
  .min(1)
  .messages({
    'object.min': 'Informe ao menos um campo para atualizar.',
  });

const createEscalaSchema = Joi.object({
  civil_id: Joi.number().integer().positive().optional(),
  nome_completo: Joi.when('civil_id', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.string().min(3).max(150).required().messages({
      'string.empty': 'O nome do medico e obrigatorio.',
      'any.required': 'O nome do medico e obrigatorio.',
    }),
  }),
  funcao: Joi.when('civil_id', {
    is: Joi.exist(),
    then: Joi.forbidden(),
    otherwise: Joi.string().min(3).max(100).required().messages({
      'string.empty': 'A funcao e obrigatoria.',
      'any.required': 'A funcao e obrigatoria.',
    }),
  }),
  telefone: Joi.when('civil_id', {
    is: Joi.exist(),
    then: telefoneField.optional(),
    otherwise: telefoneField,
  }),
  observacoes: Joi.string().allow(null, '').optional(),
  entrada_servico: Joi.date().iso().required().messages({
    'date.base': 'A data/hora de entrada deve ser uma data valida.',
    'any.required': 'A data/hora de entrada e obrigatoria.',
  }),
  saida_servico: Joi.date().iso().required().messages({
    'date.base': 'A data/hora de saida deve ser uma data valida.',
    'any.required': 'A data/hora de saida e obrigatoria.',
  }),
  status_servico: Joi.string().valid('Presente', 'Ausente').required().messages({
    'any.only': 'O status deve ser Presente ou Ausente.',
    'any.required': 'O status e obrigatorio.',
  }),
  ativo: Joi.boolean().optional(),
}).or('civil_id', 'nome_completo');

const updateEscalaSchema = Joi.object({
  civil_id: Joi.number().integer().positive().optional(),
  nome_completo: Joi.string().min(3).max(150).optional(),
  funcao: Joi.string().min(3).max(100).optional(),
  telefone: telefoneField.optional(),
  observacoes: Joi.string().allow(null, '').optional(),
  entrada_servico: Joi.date().iso().optional(),
  saida_servico: Joi.date().iso().optional(),
  status_servico: Joi.string().valid('Presente', 'Ausente').optional(),
  ativo: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'Informe ao menos um campo para atualizar.',
  });

const escalaMedicoValidator = {
  create: {
    body: createCivilSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateCivilSchema,
  },
  createEscala: {
    body: createEscalaSchema,
  },
  updateEscala: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateEscalaSchema,
  },
  schemas: {
    createCivil: createCivilSchema,
    updateCivil: updateCivilSchema,
    createEscala: createEscalaSchema,
    updateEscala: updateEscalaSchema,
  },
};

module.exports = escalaMedicoValidator;
