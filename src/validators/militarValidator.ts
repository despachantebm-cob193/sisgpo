import { Joi } from 'express-validation';

const telefoneRegex = /^\(\d{2}\)\s?\d{4,5}-\d{4}$/;

export type MilitarBaseDTO = {
  matricula: string;
  posto_graduacao: string;
  nome_completo: string;
  obm_id?: number | null;
  obm_nome?: string | null;
  telefone?: string | null;
  ativo: boolean;
  nome_guerra?: string | null;
};

export type CreateMilitarDTO = MilitarBaseDTO;
export type UpdateMilitarDTO = Partial<MilitarBaseDTO>;

const militarFields = {
  matricula: Joi.string().min(1).max(20).required().messages({
    'string.empty': 'A matricula nao pode ser vazia.',
    'any.required': 'A matricula e obrigatoria.',
  }),
  posto_graduacao: Joi.string().min(2).max(50).required().messages({
    'string.empty': 'O posto/graducao nao pode ser vazio.',
    'any.required': 'O posto/graducao e obrigatorio.',
  }),
  nome_completo: Joi.string().min(3).max(150).required().messages({
    'string.empty': 'O nome completo nao pode ser vazio.',
    'any.required': 'O nome completo e obrigatorio.',
  }),
  obm_id: Joi.number().integer().optional().allow(null),
  obm_nome: Joi.string().max(150).optional().allow(null, ''),
  telefone: Joi.string()
    .pattern(telefoneRegex)
    .allow(null, '')
    .optional()
    .messages({
      'string.pattern.base': 'O telefone deve estar no formato (XX) XXXX-XXXX ou (XX) XXXXX-XXXX.',
    }),
  ativo: Joi.boolean().required(),
  nome_guerra: Joi.string().max(50).optional().allow(null, ''),
};

const createMilitarSchema = Joi.object<CreateMilitarDTO>(militarFields);
const updateMilitarSchema = Joi.object<UpdateMilitarDTO>(militarFields).min(1).options({ allowUnknown: true });

const militarValidator = {
  create: {
    body: createMilitarSchema,
  },
  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: updateMilitarSchema,
  },
  schemas: {
    create: createMilitarSchema,
    update: updateMilitarSchema,
  },
};

export default militarValidator;
