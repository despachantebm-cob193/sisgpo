// Arquivo: backend/src/validators/userValidator.js

const Joi = require('joi');

const changePasswordSchema = Joi.object({
  senhaAtual: Joi.string().required().messages({
    'string.empty': 'A senha atual é obrigatória.',
    'any.required': 'A senha atual é obrigatória.',
  }),
  novaSenha: Joi.string().min(6).required().messages({
    'string.min': 'A nova senha deve ter no mínimo {#limit} caracteres.',
    'string.empty': 'A nova senha é obrigatória.',
    'any.required': 'A nova senha é obrigatória.',
  }),
  confirmarNovaSenha: Joi.string().valid(Joi.ref('novaSenha')).required().messages({
    'any.only': 'A confirmação de senha não corresponde à nova senha.',
    'string.empty': 'A confirmação de senha é obrigatória.',
    'any.required': 'A confirmação de senha é obrigatória.',
  }),
});

module.exports = {
  changePasswordSchema,
};
