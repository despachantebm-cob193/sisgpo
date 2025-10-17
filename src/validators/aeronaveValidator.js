const Joi = require('joi');
const AppError = require('../utils/AppError');
const validationMiddleware = require('../middlewares/validationMiddleware');

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
  .options({ allowUnknown: true });

const ensureValidIdParam = (req, res, next) => {
  const parsedId = Number(req.params.id);
  if (!Number.isInteger(parsedId) || parsedId <= 0) {
    return next(new AppError('ID invalido.', 400));
  }

  req.params.id = parsedId;
  return next();
};

module.exports = {
  create: validationMiddleware(createAeronaveSchema),
  update: [ensureValidIdParam, validationMiddleware(updateAeronaveSchema)],
  delete: ensureValidIdParam,
};
