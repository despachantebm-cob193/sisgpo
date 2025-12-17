import { Joi } from 'express-validation';

const escalaSchema = Joi.object({
  superior_dia: Joi.string().allow(null, ''),
  superior_noite: Joi.string().allow(null, ''),
  supervisor_dia: Joi.string().allow(null, ''),
  supervisor_noite: Joi.string().allow(null, ''),
  chefe_sad: Joi.string().allow(null, ''),
  chefe_centro_ctrl: Joi.string().allow(null, ''),
  chefe_codec: Joi.string().allow(null, ''),
  comandante_operacional: Joi.string().allow(null, ''),
});

const escalaValidator = {
  update: {
    body: escalaSchema,
  },
  schemas: {
    update: escalaSchema,
  },
};

export = escalaValidator;
