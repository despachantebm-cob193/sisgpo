// Arquivo: backend/src/validators/userValidator.js

const Joi = require('joi');

const createUserSchema = Joi.object({
  login: Joi.string().trim().min(3).max(50).required().messages({
    'string.base': 'O login precisa ser um texto.',
    'string.min': 'O login deve ter ao menos {#limit} caracteres.',
    'string.max': 'O login deve ter no maximo {#limit} caracteres.',
    'any.required': 'O login e obrigatorio.',
    'string.empty': 'O login e obrigatorio.',
  }),
  nome: Joi.string().trim().min(2).max(150).required().messages({
    'string.base': 'O nome precisa ser um texto.',
    'string.min': 'O nome deve ter ao menos {#limit} caracteres.',
    'string.max': 'O nome deve ter no maximo {#limit} caracteres.',
    'any.required': 'O nome e obrigatorio.',
    'string.empty': 'O nome e obrigatorio.',
  }),
  nome_completo: Joi.string().trim().min(3).max(255).required().messages({
    'string.base': 'O nome completo precisa ser um texto.',
    'string.min': 'O nome completo deve ter ao menos {#limit} caracteres.',
    'string.max': 'O nome completo deve ter no maximo {#limit} caracteres.',
    'any.required': 'O nome completo e obrigatorio.',
    'string.empty': 'O nome completo e obrigatorio.',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).required().messages({
    'string.email': 'Informe um email valido.',
    'any.required': 'O email e obrigatorio.',
    'string.empty': 'O email e obrigatorio.',
  }),
  senha: Joi.string().trim().min(6).required().messages({
    'string.min': 'A senha deve ter ao menos {#limit} caracteres.',
    'any.required': 'A senha e obrigatoria.',
    'string.empty': 'A senha e obrigatoria.',
  }),
  confirmarSenha: Joi.string().trim().valid(Joi.ref('senha')).required().messages({
    'any.only': 'A confirmacao de senha deve ser igual a senha.',
    'any.required': 'A confirmacao de senha e obrigatoria.',
    'string.empty': 'A confirmacao de senha e obrigatoria.',
  }),
  perfil: Joi.string().trim().valid('admin', 'user').required().messages({
    'any.only': 'O perfil deve ser admin ou user.',
    'any.required': 'O perfil e obrigatorio.',
    'string.empty': 'O perfil e obrigatorio.',
  }),
});

const updateUserSchema = Joi.object({
  login: Joi.string().trim().min(3).max(50).messages({
    'string.min': 'O login deve ter ao menos {#limit} caracteres.',
    'string.max': 'O login deve ter no maximo {#limit} caracteres.',
  }),
  nome: Joi.string().trim().min(2).max(150).messages({
    'string.min': 'O nome deve ter ao menos {#limit} caracteres.',
    'string.max': 'O nome deve ter no maximo {#limit} caracteres.',
    'string.empty': 'O nome nao pode ficar em branco.',
  }),
  nome_completo: Joi.string().trim().min(3).max(255).messages({
    'string.min': 'O nome completo deve ter ao menos {#limit} caracteres.',
    'string.max': 'O nome completo deve ter no maximo {#limit} caracteres.',
    'string.empty': 'O nome completo nao pode ficar em branco.',
  }),
  email: Joi.string().trim().email({ tlds: { allow: false } }).messages({
    'string.email': 'Informe um email valido.',
    'string.empty': 'O email nao pode ficar em branco.',
  }),
  perfil: Joi.string().trim().valid('admin', 'user').messages({
    'any.only': 'O perfil deve ser admin ou user.',
  }),
  senha: Joi.string().trim().min(6).messages({
    'string.min': 'A senha deve ter ao menos {#limit} caracteres.',
  }),
  confirmarSenha: Joi.when('senha', {
    is: Joi.exist(),
    then: Joi.string().trim().valid(Joi.ref('senha')).required().messages({
      'any.only': 'A confirmacao de senha deve ser igual a nova senha.',
      'any.required': 'Confirme a nova senha para atualizar.',
      'string.empty': 'Confirme a nova senha para atualizar.',
    }),
    otherwise: Joi.forbidden().messages({
      'any.unknown': 'Informe a nova senha para confirmar.',
    }),
  }),
})
  .min(1)
  .messages({
    'object.min': 'Informe ao menos um campo para atualizar.',
  });

const updateUserStatusSchema = Joi.object({
  ativo: Joi.boolean().required().messages({
    'any.required': 'O status do usuario e obrigatorio.',
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
  updateUserSchema,
  updateUserStatusSchema,
  changePasswordSchema,
};
