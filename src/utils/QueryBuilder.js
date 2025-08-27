/**
 * Constrói dinamicamente queries SQL para listagem, filtragem e paginação,
 * sendo compatível com o driver 'pg' (node-postgres).
 *
 * @param {object} queryParams - O objeto req.query da requisição Express.
 * @param {string} baseTable - O nome da tabela principal para a consulta (ex: 'militares').
 * @param {object} filterConfig - Um objeto que mapeia os nomes dos query params para as colunas do banco de dados e seus operadores.
 *                                Ex: { posto_graduacao: { column: 'posto_graduacao', operator: 'ILIKE' }, obm_id: { column: 'obm_id' } }
 * @param {string} [defaultSort='1 ASC'] - A coluna e direção padrão para ordenação. '1 ASC' ordena pela primeira coluna.
 * @returns {{
 *   dataQuery: string,
 *   countQuery: string,
 *   dataParams: any[],
 *   countParams: any[],
 *   page: number,
 *   limit: number
 * }} - Um objeto contendo as queries e os parâmetros prontos para uso.
 */
function QueryBuilder(queryParams, baseTable, filterConfig, defaultSort = '1 ASC') {
  // Extrai e define valores padrão para paginação
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;

  let baseQuery = `FROM ${baseTable}`;
  const conditions = [];
  const params = [];
  let paramIndex = 1;

  // Itera sobre a configuração de filtros permitidos
  Object.keys(filterConfig).forEach(key => {
    // Verifica se o filtro foi realmente passado na URL (req.query)
    if (queryParams[key]) {
      const { column, operator = '=' } = filterConfig[key];
      let value = queryParams[key];

      // Monta a condição e o valor de acordo com o operador
      if (operator.toUpperCase() === 'ILIKE') {
        conditions.push(`${column} ILIKE $${paramIndex++}`);
        value = `%${value}%`; // Adiciona wildcards para a busca parcial
      } else {
        // Para outros operadores como '=', '>=', '<=', etc.
        conditions.push(`${column} ${operator} $${paramIndex++}`);
      }
      params.push(value);
    }
  });

  // Adiciona a cláusula WHERE se houver condições
  if (conditions.length > 0) {
    baseQuery += ' WHERE ' + conditions.join(' AND ');
  }

  // Clona os parâmetros para a query de contagem (que não tem LIMIT/OFFSET)
  const countParams = [...params];
  const countQuery = `SELECT COUNT(*) ${baseQuery};`;

  // Adiciona os parâmetros de paginação para a query de dados
  const dataParams = [...params, limit, offset];
  const dataQuery = `SELECT * ${baseQuery} ORDER BY ${defaultSort} LIMIT $${paramIndex++} OFFSET $${paramIndex++};`;

  return { dataQuery, countQuery, dataParams, countParams, page, limit };
}

module.exports = QueryBuilder;
