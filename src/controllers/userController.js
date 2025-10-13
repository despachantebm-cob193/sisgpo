// Arquivo: backend/src/controllers/userController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

const sanitizeUser = (user) => ({
  id: user.id,
  login: user.login,
  perfil: user.perfil,
  ativo: user.ativo,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const getDbClient = () => db.client?.config?.client;
const isLiteClient = () => {
  const client = getDbClient();
  return client && ['sqlite3', 'better-sqlite3', 'sqlite'].includes(client);
};

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
      ativo: true,
    };

    let createdUserRecord;

    if (isLiteClient()) {
      const insertedIds = await db('usuarios').insert(insertPayload);
      const userId = Array.isArray(insertedIds) ? insertedIds[0] : insertedIds;
      createdUserRecord = await db('usuarios')
        .where({ id: userId })
        .first('id', 'login', 'perfil', 'ativo', 'created_at', 'updated_at');
    } else {
      const insertedRows = await db('usuarios')
        .insert(insertPayload)
        .returning(['id', 'login', 'perfil', 'ativo', 'created_at', 'updated_at']);

      createdUserRecord = Array.isArray(insertedRows) ? insertedRows[0] : insertedRows;
    }

    res.status(201).json({
      message: 'Usuario criado com sucesso!',
      user: sanitizeUser(createdUserRecord),
    });
  },

  /**
   * Atualiza dados de um usuario.
   */
  update: async (req, res) => {
    const { id } = req.params;
    const { login, perfil, senha } = req.body;
    const userId = Number(id);

    const user = await db('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const updatePayload = { updated_at: db.fn.now() };

    if (login && login !== user.login) {
      const loginInUse = await db('usuarios').where({ login }).whereNot({ id: userId }).first();
      if (loginInUse) {
        throw new AppError('Login informado ja esta em uso.', 409);
      }
      updatePayload.login = login;
    }

    if (perfil) {
      updatePayload.perfil = perfil.toLowerCase();
    }

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.senha_hash = await bcrypt.hash(senha, salt);
    }

    const updatableFields = ['login', 'perfil', 'senha_hash'];
    const hasUpdates = updatableFields.some((field) => field in updatePayload);
    if (!hasUpdates) {
      return res.status(200).json({
        message: 'Nenhuma alteracao aplicada ao usuario.',
        user: sanitizeUser(user),
      });
    }

    await db('usuarios').where({ id: userId }).update(updatePayload);

    const updatedUser = await db('usuarios')
      .where({ id: userId })
      .first('id', 'login', 'perfil', 'ativo', 'created_at', 'updated_at');

    res.status(200).json({
      message: 'Usuario atualizado com sucesso!',
      user: sanitizeUser(updatedUser),
    });
  },

  /**
   * Atualiza o status (ativo/inativo) do usuario.
   */
  updateStatus: async (req, res) => {
    const { id } = req.params;
    const { ativo } = req.body;
    const targetUserId = Number(id);

    const user = await db('usuarios').where({ id: targetUserId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    if (targetUserId === req.userId && ativo === false) {
      throw new AppError('Nao e possivel desativar a propria conta.', 400);
    }

    if (user.ativo === ativo) {
      return res.status(200).json({
        message: 'Status do usuario permanece inalterado.',
        user: sanitizeUser(user),
      });
    }

    await db('usuarios')
      .where({ id: targetUserId })
      .update({ ativo, updated_at: db.fn.now() });

    const updatedUser = await db('usuarios')
      .where({ id: targetUserId })
      .first('id', 'login', 'perfil', 'ativo', 'created_at', 'updated_at');

    res.status(200).json({
      message: ativo ? 'Usuario reativado com sucesso!' : 'Usuario desativado com sucesso!',
      user: sanitizeUser(updatedUser),
    });
  },

  /**
   * Remove um usuario do sistema.
   */
  delete: async (req, res) => {
    const { id } = req.params;
    const targetUserId = Number(id);

    const user = await db('usuarios').where({ id: targetUserId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    if (targetUserId === req.userId) {
      throw new AppError('Nao e possivel excluir a propria conta.', 400);
    }

    await db('usuarios').where({ id: targetUserId }).del();

    res.status(200).json({ message: 'Usuario removido com sucesso.' });
  },

  /**
   * Lista todos os usuarios cadastrados.
   */
  list: async (_req, res) => {
    const users = await db('usuarios')
      .select('id', 'login', 'perfil', 'ativo', 'created_at', 'updated_at')
      .orderBy('login', 'asc');

    res.status(200).json({
      users: users.map(sanitizeUser),
    });
  },
};

module.exports = userController;
