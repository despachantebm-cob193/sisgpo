// Arquivo: backend/src/controllers/servicoDiaController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

const servicoDiaController = {
  // Busca o serviço do dia para uma data específica (ou a data atual)
  getByDate: async (req, res) => {
    const { data } = req.query;
    // Se nenhuma data for fornecida, usa a data atual
    const dataBusca = data || new Date().toISOString().split('T')[0];

    try {
      const servico = await db('servico_dia as sd')
        .leftJoin('militares as m', 'sd.militar_id', 'm.id')
        .select(
          'sd.funcao',
          'm.nome_guerra',
          'm.posto_graduacao',
          'm.id as militar_id' // Inclui o ID para edição
        )
        .where('sd.data', '=', dataBusca);

      res.status(200).json(servico);
    } catch (error) {
      console.error("ERRO AO BUSCAR SERVIÇO DO DIA:", error);
      throw new AppError("Não foi possível carregar os dados do serviço de dia.", 500);
    }
  },

  // Salva ou atualiza o serviço do dia
  save: async (req, res) => {
    const { data, servicos } = req.body;

    if (!data || !servicos || !Array.isArray(servicos)) {
      throw new AppError('Formato de dados inválido. Data e lista de serviços são obrigatórios.', 400);
    }

    try {
      await db.transaction(async trx => {
        // Deleta todos os registros para a data especificada para garantir uma atualização limpa
        await trx('servico_dia').where({ data }).del();

        // Filtra apenas os serviços que têm um militar_id válido para inserir
        const servicosParaInserir = servicos
          .filter(servico => servico.funcao && servico.militar_id)
          .map(servico => ({
            data,
            funcao: servico.funcao,
            militar_id: Number(servico.militar_id),
          }));

        // Insere os novos registros em lote, se houver algum
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
