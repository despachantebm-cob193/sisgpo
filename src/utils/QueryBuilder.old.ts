import { Knex } from 'knex';

type FilterConfig = Record<string, { column: string; operator?: string }>;

export interface QueryBuilderResult {
  query: Knex.QueryBuilder;
  countQuery: Knex.QueryBuilder;
  page: number;
  limit: number;
}

export function QueryBuilder(
  db: Knex,
  queryParams: Record<string, any>,
  baseTable: string,
  filterConfig: FilterConfig,
  defaultSort = 'id ASC',
): QueryBuilderResult {
  const page = parseInt(queryParams.page, 10) || 1;
  const limit = parseInt(queryParams.limit, 10) || 10;
  const offset = (page - 1) * limit;

  const query = db(baseTable);

  Object.keys(filterConfig).forEach((key) => {
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

  const countQuery = query.clone().clearSelect().clearOrder().count({ count: '*' }).first();

  const [sortColumn, sortDirection] = defaultSort.split(' ');
  query.select('*').orderBy(sortColumn, sortDirection || 'asc').limit(limit).offset(offset);

  return { query, countQuery, page, limit };
}

export default QueryBuilder;
