// Arquivo: backend/src/validators/userValidator.js

const Joi = require('joi');

const createUserSchema = Joi.object({
  login: Joi.string().min(3).max(50).required().messages({
    'string.base': 'O login precisa ser um texto.',
    'string.min': 'O login deve ter ao menos {#limit} caracteres.',
    'string.max': 'O login deve ter no maximo {#limit} caracteres.',
    'any.required': 'O login e obrigatorio.',
    'string.empty': 'O login e obrigatorio.',
  }),
  senha: Joi.string().min(6).required().messages({
    'string.min': 'A senha deve ter ao menos {#limit} caracteres.',
    'any.required': 'A senha e obrigatoria.',
    'string.empty': 'A senha e obrigatoria.',
  }),
  confirmarSenha: Joi.string().valid(Joi.ref('senha')).required().messages({
    'any.only': 'A confirmacao de senha deve ser igual a senha.',
    'any.required': 'A confirmacao de senha e obrigatoria.',
    'string.empty': 'A confirmacao de senha e obrigatoria.',
  }),
  perfil: Joi.string().valid('admin', 'user').required().messages({
    'any.only': 'O perfil deve ser admin ou user.',
    'any.required': 'O perfil e obrigatorio.',
    'string.empty': 'O perfil e obrigatorio.',
  }),
});

const changePasswordSchema = Joi.object({
  senhaAtual: Joi.string().required().messages({
    'string.empty': 'A senha atual e obrigatoria.',
    'any.required': 'A senha atual e obrigatoria.',
  }),
  novaSenha: Joi.string().min(6).required().messages({
    'string.min': 'A nova senha deve ter ao menos {#limit} caracteres.',
    'string.empty': 'A nova senha e obrigatoria.',
    'any.required': 'A nova senha e obrigatoria.',
  }),
  confirmarNovaSenha: Joi.string().valid(Joi.ref('novaSenha')).required().messages({
    'any.only': 'A confirmacao de senha nao corresponde a nova senha.',
    'string.empty': 'A confirmacao de senha e obrigatoria.',
    'any.required': 'A confirmacao de senha e obrigatoria.',
  }),
});

module.exports = {
  createUserSchema,
  changePasswordSchema,
};
