// Arquivo: backend/src/controllers/userController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

const sanitizeUser = (user) => ({
  id: user.id,
  login: user.login,
  perfil: user.perfil,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const userController = {
  /**
   * Altera a senha do usuario logado.
   */
  changePassword: async (req, res) => {
    const { senhaAtual, novaSenha } = req.body;
    const userId = req.userId;

    const user = await db('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const isPasswordValid = await bcrypt.compare(senhaAtual, user.senha_hash);
    if (!isPasswordValid) {
      throw new AppError('Senha atual incorreta.', 400);
    }

    const salt = await bcrypt.genSalt(10);
    const novaSenhaHash = await bcrypt.hash(novaSenha, salt);

    await db('usuarios')
      .where({ id: userId })
      .update({
        senha_hash: novaSenhaHash,
        updated_at: db.fn.now(),
      });

    res.status(200).json({ message: 'Senha alterada com sucesso!' });
  },

  /**
   * Cria um novo usuario com o perfil informado.
   */
  create: async (req, res) => {
    const { login, senha, perfil } = req.body;
    const normalizedPerfil = perfil.toLowerCase();

    const existingUser = await db('usuarios').where({ login }).first();
    if (existingUser) {
      throw new AppError('Login ja esta em uso.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    const insertPayload = {
      login,
      senha_hash: senhaHash,
      perfil: normalizedPerfil,
    };

    const client = db.client?.config?.client;
    let createdUserRecord;

    if (client && ['sqlite3', 'better-sqlite3', 'sqlite'].includes(client)) {
      const insertedIds = await db('usuarios').insert(insertPayload);
      const userId = Array.isArray(insertedIds) ? insertedIds[0] : insertedIds;
      createdUserRecord = await db('usuarios')
        .where({ id: userId })
        .first('id', 'login', 'perfil', 'created_at', 'updated_at');
    } else {
      const insertedRows = await db('usuarios')
        .insert(insertPayload)
        .returning(['id', 'login', 'perfil', 'created_at', 'updated_at']);

      createdUserRecord = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows;
    }

    res.status(201).json({
      message: 'Usuario criado com sucesso!',
      user: sanitizeUser(createdUserRecord),
    });
  },

  /**
   * Lista todos os usuarios cadastrados.
   */
  list: async (_req, res) => {
    const users = await db('usuarios')
      .select('id', 'login', 'perfil', 'created_at', 'updated_at')
      .orderBy('login', 'asc');

    res.status(200).json({
      users: users.map(sanitizeUser),
    });
  },
};

module.exports = userController;
