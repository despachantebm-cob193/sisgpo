// Arquivo: backend/src/middlewares/ensureAdmin.js

const AppError = require('../utils/AppError');

const ensureAdmin = (req, _res, next) => {
  const perfil = (req.userPerfil || '').toLowerCase();

  if (perfil !== 'admin') {
    throw new AppError('Acesso restrito a administradores.', 403);
  }

  return next();
};

module.exports = ensureAdmin;
