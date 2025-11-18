// Arquivo: src/services/aiAssistedValidationService.js

const db = require('../config/database');

/**
 * Simula a validação de dados de viaturas usando uma abordagem baseada em regras,
 * imitando o comportamento de um LLM para a tarefa específica.
 */
class AIAssistedValidationService {
  /**
   * Valida um lote de registros de viaturas.
   * @param {Array<Object>} viaturaData - Um array de objetos, onde cada objeto representa uma viatura.
   * @returns {Promise<Object>} - Um objeto com o status da validação e uma lista de erros.
   */
  async validateViaturaUpload(viaturaData) {
    const errors = [];
    const existingViaturas = await db('viaturas').select('prefixo');
    const existingPrefixos = new Set(existingViaturas.map(v => v.prefixo.toUpperCase().trim()));

    const processedPrefixos = new Set();
    const rowsWithDelimiterWarnings = new Set();

    viaturaData.forEach((viatura, index) => {
      const lineNumber = viatura.rowNumber ?? index + 2; // Usa a linha original quando disponível

      // 1. Validação de campos obrigatórios
      if (!viatura.prefixo) {
        errors.push({
          linha: lineNumber,
          campo: 'prefixo',
          tipo: 'campo_faltante',
          descricao: `O campo 'prefixo' é obrigatório e não foi preenchido.`,
          sugestao: 'Preencha o prefixo da viatura.'
        });
      }
      if (!viatura.obm) {
        errors.push({
          linha: lineNumber,
          campo: 'obm',
          tipo: 'campo_faltante',
          descricao: `O campo 'obm' é obrigatório e não foi preenchido.`,
          sugestao: 'Preencha a OBM da viatura.'
        });
      }

      if (viatura.missingDelimiterHint && !rowsWithDelimiterWarnings.has(lineNumber)) {
        errors.push({
          linha: lineNumber,
          campo: 'prefixos',
          tipo: 'prefixo_unico_sem_delimitador',
          descricao: `O valor '${viatura.rawPrefixos || viatura.prefixo}' parece conter múltiplos prefixos sem delimitador.`,
          sugestao: 'Separe os prefixos com vírgula, ponto e vírgula, barra ou espaços duplos antes de importar.'
        });
        rowsWithDelimiterWarnings.add(lineNumber);
      }

      // 2. Validação de placa foi removida conforme solicitado.

      // 3. Verificação de duplicatas no lote e no banco de dados
      if (viatura.prefixo) {
        const prefixo = viatura.prefixo.toUpperCase().trim();
        if (processedPrefixos.has(prefixo)) {
          errors.push({
            linha: lineNumber,
            campo: 'prefixo',
            tipo: 'duplicata_no_lote',
            descricao: `O prefixo '${viatura.prefixo}' está duplicado neste arquivo.`,
            sugestao: 'Remova uma das viaturas com este prefixo ou corrija o valor.'
          });
        } else if (existingPrefixos.has(prefixo)) {
            // Apenas um aviso, pois a atualização é um comportamento esperado
            console.log(`Info: Prefixo '${prefixo}' já existe no banco e será atualizado.`);
        }
        processedPrefixos.add(prefixo);
      }
    });

    if (errors.length > 0) {
      return {
        status: 'erro',
        erros: errors
      };
    }

    return {
      status: 'validado',
      erros: []
    };
  }
}

module.exports = new AIAssistedValidationService();
