// sisgpo/src/middlewares/ssoAuthMiddleware.js

const jwt = require('jsonwebtoken');
const { AppError } = require('../utils/AppError');

// Use uma variável de ambiente para o segredo compartilhado
const SHARED_SECRET = process.env.SSO_SHARED_SECRET || 'seu-segredo-compartilhado';

function ssoAuthMiddleware(request, response, next) {
  const authHeader = request.headers.authorization;

  if (!authHeader) {
    throw new AppError('Token de autenticação não fornecido.', 401);
  }

  const [, token] = authHeader.split(' ');

  try {
    jwt.verify(token, SHARED_SECRET);

    return next();
  } catch (error) {
    throw new AppError('Token de autenticação inválido.', 401);
  }
}

module.exports = { ssoAuthMiddleware };