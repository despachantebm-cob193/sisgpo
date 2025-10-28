const { Joi } = require('express-validation');

const createViaturaSchema = Joi.object({
  prefixo: Joi.string().min(3).max(50).required().messages({
    'string.empty': 'O prefixo n\u00e3o pode ser vazio.',
    'any.required': 'O prefixo \u00e9 obrigat\u00f3rio.',
  }),
  ativa: Joi.boolean().optional().default(true),
  cidade: Joi.string().max(100).optional().allow(null, ''),
  obm: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
}).options({ allowUnknown: true });

const updateViaturaSchema = Joi.object({
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

module.exports = viaturaValidator;
