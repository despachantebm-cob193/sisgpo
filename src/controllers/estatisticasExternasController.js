// src/controllers/estatisticasExternasController.js

const db = require('../config/database');
const AppError = require('../utils/AppError');

// Desestrutura a instância de conexão externa
const knexExterno = db.knexExterno; 

const estatisticasExternasController = {
    getDashboardData: async (req, res) => {
        try {
            // 1. Contagem total de Plantões e data do último plantão (Tabela: plantao)
            const totais = await knexExterno('plantao')
                .select(
                    knexExterno.raw('COUNT(DISTINCT id) as total_plantoes'),
                    knexExterno.raw('MAX(data_inicio) as ultimo_plantao_inicio')
                )
                .first();

            // 2. Detalhe de Escalas Recentes (Tabela: escalas)
            const escalaDetalhe = await knexExterno('escalas')
                .select('nome', 'turno')
                .orderBy('id', 'desc') 
                .limit(5);

            // 3. Contagem de militares em plantão (Tabela: militar_plantao)
            const totalMilitaresPlantao = await knexExterno('militar_plantao')
                .count('militar_matricula as count')
                .first();

            // Combina os resultados e garante que os números são inteiros
            const dados = {
                totais: {
                    total_plantoes: totais ? parseInt(totais.total_plantoes, 10) : 0,
                    ultimo_plantao_inicio: totais ? totais.ultimo_plantao_inicio : null,
                    total_militares_plantao: totalMilitaresPlantao ? parseInt(totalMilitaresPlantao.count, 10) : 0,
                },
                escalas_recentes: escalaDetalhe
            };

            res.status(200).json(dados);

        } catch (error) {
            console.error('[EstatisticasExternasController] Erro ao buscar dados externos:', error);
            throw new AppError('Não foi possível conectar ou buscar dados do sistema externo. Verifique a string de conexão externa.', 500);
        }
    },
};

module.exports = estatisticasExternasController;