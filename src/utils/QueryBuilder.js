// src/utils/QueryBuilder.js

/**
 * Constrói dinamicamente queries Knex para listagem, filtragem e paginação.
 * @param {import("knex").Knex} db - A instância do Knex.
 * @param {object} queryParams - O objeto req.query da requisição Express.
 * @param {string} baseTable - O nome da tabela principal.
 * @param {object} filterConfig - Mapeamento dos filtros permitidos.
 * @param {string} [defaultSort='id ASC'] - Ordenação padrão.
 */
function QueryBuilder(db, queryParams, baseTable, filterConfig, defaultSort = 'id ASC') {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;

  // Inicia a query base
  const query = db(baseTable);

  // Aplica filtros
  Object.keys(filterConfig).forEach(key => {
    if (queryParams[key]) {
      const { column, operator = '=' } = filterConfig[key];
      const value = queryParams[key];
      if (operator.toLowerCase() === 'ilike') {
        query.where(column, 'ilike', `%${value}%`);
      } else {
        query.where(column, operator, value);
      }
    }
  });

  // --- CORREÇÃO APLICADA AQUI ---
  // 1. Clona a query base (apenas com os filtros WHERE)
  // 2. Remove qualquer cláusula SELECT, ORDER, etc. com .clearSelect() e .clearOrder()
  // 3. Aplica a função de contagem.
  const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' }).first();
  // -----------------------------

  // Aplica a seleção de colunas, ordenação e paginação na query principal
  const [sortColumn, sortDirection] = defaultSort.split(' ');
  query
    .select('*')
    .orderBy(sortColumn, sortDirection || 'asc')
    .limit(limit)
    .offset(offset);

  return { query, countQuery, page, limit };
}

module.exports = QueryBuilder;
