const { Joi } = require('express-validation');

const createAeronaveSchema = Joi.object({
  prefixo: Joi.string().trim().min(1).required().messages({
    'string.base': 'O prefixo deve ser um texto.',
    'string.empty': 'O prefixo e obrigatorio.',
    'any.required': 'O prefixo e obrigatorio.',
  }),
  tipo_asa: Joi.string().valid('fixa', 'rotativa').required().messages({
    'any.only': 'Tipo de asa invalido.',
    'any.required': 'Tipo de asa e obrigatorio.',
  }),
  ativa: Joi.boolean().optional(),
});

const updateAeronaveSchema = Joi.object({
  prefixo: Joi.string().trim().min(1).optional(),
  tipo_asa: Joi.string().valid('fixa', 'rotativa').optional(),
  ativa: Joi.boolean().optional(),
})
  .min(1)
  .messages({
    'object.min': 'Informe ao menos um campo para atualizar.',
  });

const aeronaveValidator = {
  create: {
    body: createAeronaveSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
    body: updateAeronaveSchema,
  },
  delete: {
    params: Joi.object({
      id: Joi.number().integer().positive().required(),
    }),
  },
  schemas: {
    create: createAeronaveSchema,
    update: updateAeronaveSchema,
  },
};

module.exports = aeronaveValidator;
