const Joi = require('joi');

// Schema para a CRIAÇÃO de uma nova OBM
const createObmSchema = Joi.object({
  nome: Joi.string().min(3).max(100).required(),
  abreviatura: Joi.string().min(2).max(20).required(),
  cidade: Joi.string().max(50).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

// --- SCHEMA DE ATUALIZAÇÃO CORRIGIDO ---
const updateObmSchema = Joi.object({
  // Ao atualizar, se o nome for fornecido, não pode ser vazio.
  nome: Joi.string().min(3).max(100).required(),

  // A abreviatura também é obrigatória no formulário, então a mantemos como required.
  abreviatura: Joi.string().min(2).max(20).required(),

  // Campos opcionais que podem ser nulos ou vazios.
  cidade: Joi.string().max(50).optional().allow(null, ''),
  telefone: Joi.string().max(20).optional().allow(null, ''),
});

module.exports = {
  createObmSchema,
  updateObmSchema,
};
