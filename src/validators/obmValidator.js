// Arquivo: src/validators/obmValidator.js (COMPLETO E CORRIGIDO)

const { Joi } = require('express-validation');
const db = require('../config/database');

const obmValidator = {
  create: {
    body: Joi.object({
      nome: Joi.string().required().messages({
        'string.empty': 'O campo \'nome\' é obrigatório.',
        'any.required': 'O campo \'nome\' é obrigatório.'
      }),
      
      // Valida o campo 'abreviatura' (que vem do frontend)
      abreviatura: Joi.string().required().messages({
        'string.empty': 'O campo \'abreviatura\' é obrigatório.',
        'any.required': 'O campo \'abreviatura\' é obrigatório.'
      })
      .external(async (abreviatura) => {
        // Verifica se a abreviatura já existe no banco
        if (abreviatura) {
          const query = db('obms').where('abreviatura', abreviatura);
          const obm = await query.first();
          if (obm) {
            throw new Error('A abreviatura informada já está em uso.');
          }
        }
        return abreviatura;
      }),

      cidade: Joi.string().allow(null, ''),
      telefone: Joi.string().allow(null, ''),
      
      // --- ADICIONADO AQUI ---
      crbm: Joi.string().allow(null, '').max(50),
      // --- FIM DA ADIÇÃO ---
      
      // Permite o ID, mas não o valida (vem do obmToEdit)
      id: Joi.number().optional() 
    })
  },
  
  update: {
    params: Joi.object({
      id: Joi.number().integer().required()
    }),
    body: Joi.object({
      nome: Joi.string().required().messages({
        'string.empty': 'O campo \'nome\' é obrigatório.',
        'any.required': 'O campo \'nome\' é obrigatório.'
      }),
      
      // Valida 'abreviatura' na atualização
      abreviatura: Joi.string().required().messages({
        'string.empty': 'O campo \'abreviatura\' é obrigatório.',
        'any.required': 'O campo \'abreviatura\' é obrigatório.'
      })
      .external(async (abreviatura, { req }) => {
        // Verifica se a abreviatura já existe em OUTRA OBM
        if (abreviatura && req && req.params) {
          const { id } = req.params;
          const query = db('obms').where('abreviatura', abreviatura).whereNot('id', id);
          const obm = await query.first();
          if (obm) {
            throw new Error('A abreviatura informada já está em uso por outra OBM.');
          }
        }
        return abreviatura;
      }),

      cidade: Joi.string().allow(null, ''),
      telefone: Joi.string().allow(null, ''),

      // --- ADICIONADO AQUI ---
      crbm: Joi.string().allow(null, '').max(50),
      // --- FIM DA ADIÇÃO ---
      
      // Permite o ID no body (vem do obmToEdit)
      id: Joi.number().optional()
      
    }).min(1) // Pelo menos um campo deve ser enviado na atualização
  }
};

module.exports = obmValidator;