// Arquivo: backend/src/controllers/servicoDiaController.js (VERSÃO POLIMÓRFICA)

const db = require('../config/database');
const AppError = require('../utils/AppError');

const servicoDiaController = {
  getByDate: async (req, res) => {
    const { data } = req.query;
    const dataBusca = data || new Date().toISOString().split('T')[0];

    try {
      const servicos = await db('servico_dia').where({ data: dataBusca });

      const servicoMilitares = servicos.filter(s => s.pessoa_type === 'militar');
      const servicoCivis = servicos.filter(s => s.pessoa_type === 'civil');

      let militaresData = [];
      if (servicoMilitares.length > 0) {
        militaresData = await db('militares')
          .select('id', 'posto_graduacao', db.raw("COALESCE(NULLIF(TRIM(nome_guerra), ''), nome_completo) as nome_guerra"))
          .whereIn('id', servicoMilitares.map(s => s.pessoa_id));
      }

      let civisData = [];
      if (servicoCivis.length > 0) {
        civisData = await db('civis')
          .select('id', 'funcao as posto_graduacao', 'nome_completo as nome_guerra')
          .whereIn('id', servicoCivis.map(s => s.pessoa_id));
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

  save: async (req, res) => {
    const { data, servicos } = req.body;

    if (!data || !servicos || !Array.isArray(servicos)) {
      throw new AppError('Formato de dados inválido.', 400);
    }

    try {
      await db.transaction(async trx => {
        await trx('servico_dia').where({ data }).del();

        const servicosParaInserir = servicos
          .filter(s => s.funcao && s.pessoa_id && s.pessoa_type)
          .map(s => ({
            data,
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
