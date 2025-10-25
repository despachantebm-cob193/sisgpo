// Arquivo: backend/src/controllers/userController.js

const db = require('../config/database');
const bcrypt = require('bcryptjs');
const AppError = require('../utils/AppError');

const sanitizeUser = (user) => ({
  id: user.id,
  login: user.login,
  perfil: user.perfil,
  ativo: user.ativo,
  // Adicionando os novos campos para garantir que sejam retornados, se existirem
  nome_completo: user.nome_completo,
  nome: user.nome,
  email: user.email,
  created_at: user.created_at,
  updated_at: user.updated_at,
});

const getDbClient = () => db.client?.config?.client;
const isLiteClient = () => {
  const client = getDbClient();
  return client && ['sqlite3', 'better-sqlite3', 'sqlite'].includes(client);
};

const fetchAllUsers = async () => {
  const users = await db('usuarios')
    .select('*')
    .orderBy('login', 'asc');

  return users.map(sanitizeUser);
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
   * Lista todos os usuarios cadastrados.
   */
  getAll: async (_req, res) => {
    const users = await fetchAllUsers();

    res.status(200).json({
      users,
    });
  },

  /**
   * Cria um novo usuario com o perfil informado.
   */
  create: async (req, res) => {
    // CORREÇÃO: Capturando os novos campos do corpo da requisição
    const { login, senha, perfil, nome_completo, nome, email } = req.body;
    const trimmedLogin = login.trim();
    const trimmedNome = nome.trim();
    const trimmedNomeCompleto = nome_completo.trim();
    const trimmedEmail = email.trim();
    const normalizedPerfil = perfil.trim().toLowerCase();

    const existingUser = await db('usuarios').where({ login: trimmedLogin }).first();
    if (existingUser) {
      throw new AppError('Login ja esta em uso.', 409);
    }

    const salt = await bcrypt.genSalt(10);
    const senhaHash = await bcrypt.hash(senha, salt);

    // CORREÇÃO: Adicionando os campos obrigatórios ao payload de inserção
    const insertPayload = {
      login: trimmedLogin,
      senha_hash: senhaHash,
      perfil: normalizedPerfil,
      ativo: true,
      nome_completo: trimmedNomeCompleto, // Adicionado
      nome: trimmedNome,          // Adicionado
      email: trimmedEmail.toLowerCase(),         // Adicionado
    };

    let createdUserRecord;

    if (isLiteClient()) {
      const insertedIds = await db('usuarios').insert(insertPayload);
      const userId = Array.isArray(insertedIds) ? insertedIds[0] : insertedIds;
      createdUserRecord = await db('usuarios')
        .where({ id: userId })
        .first(); // Seleciona todos os campos para sanitização
    } else {
      const insertedRows = await db('usuarios')
        .insert(insertPayload)
        .returning('*'); // Retorna todos os campos para sanitização

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
    // CORREÇÃO: Permitindo a atualização dos novos campos
    const { login, perfil, senha, nome_completo, nome, email } = req.body;
    const userId = Number(id);

    const user = await db('usuarios').where({ id: userId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    const updatePayload = { updated_at: db.fn.now() };
    const trimmedLogin = typeof login === 'string' ? login.trim() : undefined;
    const trimmedNome = typeof nome === 'string' ? nome.trim() : undefined;
    const trimmedNomeCompleto = typeof nome_completo === 'string' ? nome_completo.trim() : undefined;
    const trimmedEmail = typeof email === 'string' ? email.trim() : undefined;

    if (trimmedLogin && trimmedLogin !== user.login) {
      const loginInUse = await db('usuarios').where({ login: trimmedLogin }).whereNot({ id: userId }).first();
      if (loginInUse) {
        throw new AppError('Login informado ja esta em uso.', 409);
      }
      updatePayload.login = trimmedLogin;
    }

    const normalizedPerfil = typeof perfil === 'string' ? perfil.trim().toLowerCase() : undefined;
    if (normalizedPerfil) {
      updatePayload.perfil = normalizedPerfil;
    }
    
    // CORREÇÃO: Adicionando os novos campos ao payload de atualização
    if (typeof trimmedNomeCompleto === 'string' && trimmedNomeCompleto && trimmedNomeCompleto !== (user.nome_completo ?? '')) {
      updatePayload.nome_completo = trimmedNomeCompleto;
    }
    if (typeof trimmedNome === 'string' && trimmedNome && trimmedNome !== (user.nome ?? '')) {
      updatePayload.nome = trimmedNome;
    }
    if (typeof trimmedEmail === 'string' && trimmedEmail && trimmedEmail.toLowerCase() !== (user.email ?? '').toLowerCase()) {
      updatePayload.email = trimmedEmail.toLowerCase();
    }

    if (senha) {
      const salt = await bcrypt.genSalt(10);
      updatePayload.senha_hash = await bcrypt.hash(senha, salt);
    }

    const updatableFields = ['login', 'perfil', 'senha_hash', 'nome_completo', 'nome', 'email'];
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
      .first();

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
      .first();

    res.status(200).json({
      message: ativo ? 'Usuario reativado com sucesso!' : 'Usuario desativado com sucesso!',
      user: sanitizeUser(updatedUser),
    });
  },

  /**
   * Alterna o status ativo/inativo de um usuario.
   */
  toggleActive: async (req, res) => {
    const { id } = req.params;
    const targetUserId = Number(id);

    const user = await db('usuarios').where({ id: targetUserId }).first();
    if (!user) {
      throw new AppError('Usuario nao encontrado.', 404);
    }

    if (targetUserId === req.userId) {
      throw new AppError('Nao e possivel desativar a propria conta.', 400);
    }

    const novoStatus = !user.ativo;

    await db('usuarios')
      .where({ id: targetUserId })
      .update({ ativo: novoStatus, updated_at: db.fn.now() });

    const updatedUser = await db('usuarios')
      .where({ id: targetUserId })
      .first();

    res.status(200).json({
      message: novoStatus ? 'Usuario reativado com sucesso!' : 'Usuario desativado com sucesso!',
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
    const users = await fetchAllUsers();

    res.status(200).json({
      users,
    });
  },
};

module.exports = userController;
