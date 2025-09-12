// Arquivo: backend/src/controllers/escalaMedicoController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const escalaMedicoController = {
  // --- CRUD PARA O CADASTRO DE MÉDICOS (tabela 'civis') ---
  // Esta função agora também serve para listar as escalas, pois os dados estão na mesma tabela.
  getAllCivis: async (req, res) => {
    const { nome_completo, all, data_inicio, data_fim } = req.query;
    const query = db('civis').select('*');

    // Filtros para a página de "Cadastro de Médicos"
    if (nome_completo) {
      query.where('nome_completo', 'ilike', `%${nome_completo}%`);
    }

    // Filtros para a página de "Escalas"
    if (data_inicio) {
      query.where('entrada_servico', '>=', data_inicio);
    }
    if (data_fim) {
      query.where('saida_servico', '<=', data_fim);
    }

    // Se 'all=true' for passado, retorna todos os registros sem paginação
    if (all === 'true') {
      const registros = await query.orderBy('nome_completo', 'asc');
      return res.status(200).json({ data: registros, pagination: null });
    }

    // Lógica de paginação padrão
    const page = parseInt(req.query.page, 10) || 1;
    const limit = parseInt(req.query.limit, 10) || 15;
    const offset = (page - 1) * limit;

    const countQuery = query.clone().clearSelect().clearOrder().count({ count: 'id' }).first();
    const dataQuery = query.clone().orderBy('nome_completo', 'asc').limit(limit).offset(offset);

    const [data, totalResult] = await Promise.all([dataQuery, countQuery]);
    const totalRecords = parseInt(totalResult.count, 10);
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      data,
      pagination: { currentPage: page, perPage: limit, totalPages, totalRecords },
    });
  },

  // Cria um novo registro de médico/escala
  createCivil: async (req, res) => {
    // Recebe todos os campos, incluindo os de escala
    const { nome_completo, funcao, telefone, observacoes, ativo, entrada_servico, saida_servico, status_servico } = req.body;
    const [novoRegistro] = await db('civis')
      .insert({ 
        nome_completo, 
        funcao, 
        telefone, 
        observacoes, 
        ativo: ativo !== false,
        entrada_servico,
        saida_servico,
        status_servico
      })
      .returning('*');
    res.status(201).json(novoRegistro);
  },

  // Atualiza um registro de médico/escala
  updateCivil: async (req, res) => {
    const { id } = req.params;
    const { nome_completo, funcao, telefone, observacoes, ativo, entrada_servico, saida_servico, status_servico } = req.body;
    
    const registroExists = await db('civis').where({ id }).first();
    if (!registroExists) throw new AppError('Registro de médico/escala não encontrado.', 404);
    
    const dadosAtualizacao = { 
      nome_completo, 
      funcao, 
      telefone, 
      observacoes, 
      ativo,
      entrada_servico,
      saida_servico,
      status_servico,
      updated_at: db.fn.now() 
    };
    const [registroAtualizado] = await db('civis').where({ id }).update(dadosAtualizacao).returning('*');
    res.status(200).json(registroAtualizado);
  },

  // Deleta um registro de médico/escala
  deleteCivil: async (req, res) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) throw new AppError('Registro de médico/escala não encontrado.', 404);
    res.status(204).send();
  },

  // Busca civis para os selects (sem alteração necessária)
  searchCivis: async (req, res) => {
    const { term } = req.query;
    if (!term || term.length < 2) return res.status(200).json([]);
    
    const civis = await db('civis')
      .where('nome_completo', 'ilike', `%${term}%`)
      .andWhere('ativo', true)
      .select('id', 'nome_completo', 'funcao')
      .limit(15);

    const options = civis.map(c => ({
      value: c.id,
      label: c.nome_completo,
      civil: c,
    }));
    res.status(200).json(options);
  },

  // --- FUNÇÕES ANTIGAS DE 'escala_medicos' AGORA SÃO REDIRECIONADAS OU REMOVIDAS ---
  // A função getAllEscalas agora é efetivamente a mesma que getAllCivis com filtros de data
  getAllEscalas: async (req, res) => {
    const { data_inicio, data_fim } = req.query;
    const query = db('civis')
      .select('*') // Seleciona todos os campos da tabela civis
      .whereNotNull('entrada_servico'); // Filtra apenas registros que são de fato escalas

    if (data_inicio) query.where('entrada_servico', '>=', data_inicio);
    if (data_fim) query.where('saida_servico', '<=', data_fim);

    const escalas = await query.orderBy('entrada_servico', 'desc');
    res.status(200).json(escalas);
  },

  // A função createEscala agora é a mesma que createCivil
  createEscala: async (req, res) => {
    const { civil_id, entrada_servico, saida_servico, status_servico, observacoes } = req.body;
    
    // Para criar uma escala, precisamos dos dados do médico.
    // Esta abordagem assume que o frontend enviará os dados completos do médico.
    // Uma abordagem mais simples é usar a função createCivil diretamente.
    // Por simplicidade, vamos assumir que o frontend chama a rota /civis para criar.
    // Se a rota /escala-medicos for mantida, ela precisa de mais lógica para buscar o nome do médico.
    // A melhor abordagem é unificar no frontend para usar a rota /civis.
    // Por ora, vamos implementar a criação de um novo registro civil com dados de escala.
    const { nome_completo, funcao } = req.body; // Supondo que o frontend envie isso
    const [novaEscala] = await db('civis')
      .insert({ 
        nome_completo, // Este campo é obrigatório na tabela
        funcao,        // Este campo é obrigatório na tabela
        entrada_servico, 
        saida_servico, 
        status_servico, 
        observacoes,
        ativo: true
      })
      .returning('*');
    res.status(201).json(novaEscala);
  },

  // A função deleteEscala agora é a mesma que deleteCivil
  deleteEscala: async (req, res) => {
    const { id } = req.params;
    const result = await db('civis').where({ id }).del();
    if (result === 0) throw new AppError('Registro de escala não encontrado.', 404);
    res.status(204).send();
  },
};

module.exports = escalaMedicoController;
