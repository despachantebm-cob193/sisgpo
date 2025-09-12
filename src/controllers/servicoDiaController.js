// Arquivo: backend/src/controllers/servicoDiaController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const servicoDiaController = {
  // Função para buscar os dados do serviço com base em uma data
  getByDate: async (req, res) => {
    const { data } = req.query;
    // Se nenhuma data for fornecida, usa a data atual
    const dataBusca = data ? new Date(data).toISOString() : new Date().toISOString();

    try {
      // Busca registros onde a data de busca está entre o início e o fim do plantão
      const servicos = await db('servico_dia')
        .where('data_inicio', '<=', dataBusca)
        .andWhere('data_fim', '>=', dataBusca);

      // O restante da lógica para buscar e juntar os dados de militares e civis permanece o mesmo...
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
      throw new AppError("Não foi possível carregar os dados do serviço de dia.", 500);
    }
  },

  // Função para salvar ou atualizar a escala
  save: async (req, res) => {
    const { data_inicio, data_fim, servicos } = req.body;

    if (!data_inicio || !data_fim || !servicos || !Array.isArray(servicos)) {
      throw new AppError('Formato de dados inválido. Data de início, fim e lista de serviços são obrigatórios.', 400);
    }

    try {
      await db.transaction(async trx => {
        // Deleta os registros existentes para o mesmo período para evitar duplicatas
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
      throw new AppError("Ocorreu um erro ao salvar o serviço do dia.", 500);
    }
  }
};

module.exports = servicoDiaController;
