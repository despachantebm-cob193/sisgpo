// Arquivo: backend/src/controllers/servicoDiaController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const servicoDiaController = {
  // Função para buscar os dados (código da resposta anterior, sem mudanças)
  getByDate: async (req, res, next) => {
    const { data } = req.query;
    const dataBusca = data ? new Date(data).toISOString() : new Date().toISOString();

    try {
      // 1. Encontrar o data_inicio MAIS RECENTE do plantão ativo
      const ultimoPlantao = await db('servico_dia')
        .where('data_inicio', '<=', dataBusca)
        .andWhere('data_fim', '>=', dataBusca)
        .orderBy('data_inicio', 'desc')
        .first('data_inicio'); 

      if (!ultimoPlantao) {
        return res.status(200).json([]);
      }

      // 2. Buscar TODOS os registros que pertencem a ESSE plantão específico
      const servicos = await db('servico_dia')
        .where({ data_inicio: ultimoPlantao.data_inicio }); 

      // ... (o resto da função getByDate continua igual)
      const servicoMilitares = servicos.filter(s => s.pessoa_type === 'militar');
      const servicoCivis = servicos.filter(s => s.pessoa_type === 'civil');

      let militaresData = [];
      if (servicoMilitares.length > 0) {
        militaresData = await db('militares').select('id', 'posto_graduacao', db.raw("COALESCE(NULLIF(TRIM(nome_guerra), ''), nome_completo) as nome_guerra")).whereIn('id', servicoMilitares.map(s => s.pessoa_id));
      }

      let civisData = [];
      if (servicoCivis.length > 0) {
        civisData = await db('civis').select('id', 'funcao as posto_graduacao', 'nome_completo as nome_guerra').whereIn('id', servicoCivis.map(c => c.pessoa_id));
      }

      const resultadoFinal = servicos.map(servico => {
        const pessoaData = servico.pessoa_type === 'militar'
          ? militaresData.find(m => m.id === servico.pessoa_id)
          : civisData.find(c => c.id === servico.pessoa_id);
        
        return {
          funcao: servico.funcao,
          pessoa_id: servico.pessoa_id,
          pessoa_type: servico.pessoa_type,
          nome_guerra: pessoaData?.nome_guerra || null,
          posto_graduacao: pessoaData?.posto_graduacao || null,
        };
      });

      res.status(200).json(resultadoFinal);
    } catch (error) {
      console.error("ERRO AO BUSCAR SERVIÇO DO DIA:", error);
      next(new AppError("Não foi possível carregar os dados do serviço de dia.", 500));
    }
  },

  // Função para salvar (código da resposta anterior, sem mudanças)
  save: async (req, res, next) => {
    const { data_inicio, data_fim, servicos } = req.body;

    if (!data_inicio || !data_fim || !servicos || !Array.isArray(servicos)) {
      return next(new AppError('Formato de dados inválido. Data de início, fim e lista de serviços são obrigatórios.', 400));
    }

    try {
      await db.transaction(async trx => {
        await trx('servico_dia').where({ data_inicio }).del();

        const servicosParaInserir = servicos
          .filter(s => s.funcao && s.pessoa_id && s.pessoa_type)
          .map(s => ({
            data_inicio,
            data_fim,
            funcao: s.funcao,
            pessoa_id: Number(s.pessoa_id),
            pessoa_type: s.pessoa_type,
          }));

        if (servicosParaInserir.length > 0) {
          await trx('servico_dia').insert(servicosParaInserir);
        }
      });

      res.status(200).json({ message: 'Serviço do dia salvo com sucesso!' });
    } catch (error) {
      console.error("ERRO AO SALVAR SERVIÇO DO DIA:", error);
      next(new AppError("Ocorreu um erro ao salvar o serviço do dia.", 500));
    }
  },

  // --- INÍCIO DA NOVA FUNÇÃO ---
  // Função para DELETAR a escala com base na data
  deleteByDate: async (req, res, next) => {
    const { data } = req.query; // Pega a data de início do plantão
    if (!data) {
      return next(new AppError('A data é obrigatória para excluir a escala.', 400));
    }

    const dataBusca = new Date(data).toISOString();

    try {
      // 1. Encontrar o data_inicio do plantão ativo para essa data
      // Usamos a mesma lógica do 'getByDate' para garantir que estamos deletando o plantão correto
      const ultimoPlantao = await db('servico_dia')
        .where('data_inicio', '<=', dataBusca)
        .andWhere('data_fim', '>=', dataBusca)
        .orderBy('data_inicio', 'desc')
        .first('data_inicio');

      if (!ultimoPlantao) {
        // Não há plantão para excluir, o que não é um erro
        return res.status(200).json({ message: 'Nenhuma escala ativa encontrada para esta data.' });
      }

      // 2. Deletar TODOS os registros que pertencem a ESSE plantão
      await db('servico_dia')
        .where({ data_inicio: ultimoPlantao.data_inicio })
        .del();

      res.status(200).json({ message: 'Escala do dia limpa com sucesso!' });
    } catch (error) {
      console.error("ERRO AO DELETAR SERVIÇO DO DIA:", error);
      next(new AppError("Ocorreu um erro ao limpar a escala do dia.", 500));
    }
  }
  // --- FIM DA NOVA FUNÇÃO ---
};

servicoDiaController.getServicoDia = servicoDiaController.getByDate;
servicoDiaController.updateServicoDia = servicoDiaController.save;
// --- ADICIONAR ESTA LINHA ---
servicoDiaController.deleteServicoDia = servicoDiaController.deleteByDate;

module.exports = servicoDiaController;