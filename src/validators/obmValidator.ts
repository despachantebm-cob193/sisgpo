import { Joi } from 'express-validation';
import { supabaseAdmin } from '../config/supabase';

export type CreateObmDTO = {
  nome: string;
  abreviatura: string;
  cidade?: string | null;
  telefone?: string | null;
  crbm?: string | null;
  id?: number;
  // Supabase often ignores fields not in table during insert/update unless strict, 
  // but validation ensures shape.
};

export type UpdateObmDTO = CreateObmDTO;

const obmValidator = {
  create: {
    body: Joi.object<CreateObmDTO>({
      nome: Joi.string().required().messages({
        'string.empty': "O campo 'nome' e obrigatorio.",
        'any.required': "O campo 'nome' e obrigatorio.",
      }),
      abreviatura: Joi.string()
        .required()
        .messages({
          'string.empty': "O campo 'abreviatura' e obrigatorio.",
          'any.required': "O campo 'abreviatura' e obrigatorio.",
        })
        .external(async (abreviatura: string) => {
          if (abreviatura) {
            const { data } = await supabaseAdmin
              .from('obms')
              .select('id')
              .eq('abreviatura', abreviatura)
              .single();

            if (data) {
              throw new Error('A abreviatura informada ja esta em uso.');
            }
          }
          return abreviatura;
        }),
      cidade: Joi.string().allow(null, ''),
      telefone: Joi.string().allow(null, ''),
      crbm: Joi.string().allow(null, '').max(50),
      id: Joi.number().optional(),
    }),
  },

  update: {
    params: Joi.object({
      id: Joi.number().integer().required(),
    }),
    body: Joi.object<UpdateObmDTO>({
      nome: Joi.string().required().messages({
        'string.empty': "O campo 'nome' e obrigatorio.",
        'any.required': "O campo 'nome' e obrigatorio.",
      }),
      abreviatura: Joi.string()
        .required()
        .messages({
          'string.empty': "O campo 'abreviatura' e obrigatorio.",
          'any.required': "O campo 'abreviatura' e obrigatorio.",
        })
        .external(async (abreviatura: string, ctx: any) => {
          if (abreviatura && ctx?.req?.params) {
            const { id } = ctx.req.params;
            // .neq('id', id) para excluir o proprio registro
            const { data } = await supabaseAdmin
              .from('obms')
              .select('id')
              .eq('abreviatura', abreviatura)
              .neq('id', id)
              .single();

            if (data) {
              throw new Error('A abreviatura informada ja esta em uso por outra OBM.');
            }
          }
          return abreviatura;
        }),
      cidade: Joi.string().allow(null, ''),
      telefone: Joi.string().allow(null, ''),
      crbm: Joi.string().allow(null, '').max(50),
      id: Joi.number().optional(),
    }).min(1),
  },

  schemas: {},
};

export default obmValidator;
