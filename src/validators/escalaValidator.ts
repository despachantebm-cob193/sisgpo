import { Joi } from 'express-validation';

export type EscalaDTO = {
  superior_dia?: string | null;
  superior_noite?: string | null;
  supervisor_dia?: string | null;
  supervisor_noite?: string | null;
  chefe_sad?: string | null;
  chefe_centro_ctrl?: string | null;
  chefe_codec?: string | null;
  comandante_operacional?: string | null;
};

const escalaSchema = Joi.object<EscalaDTO>({
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

export default escalaValidator;
