
import { SupabaseClient } from '@supabase/supabase-js';

/**
 * Fetches all records by repeatedly calling a query factory with pagination ranges.
 * useful when you need to construct the query fresh each time or use .range()
 */
export async function fetchAll<T>(
    queryFactory: (from: number, to: number) => PromiseLike<{ data: T[] | null; error: any }>,
    pageSize = 1000
): Promise<T[]> {
    let allData: T[] = [];
    let page = 0;

    while (true) {
        const { data, error } = await queryFactory(page * pageSize, (page + 1) * pageSize - 1);

        if (error) throw error;
        if (!data || data.length === 0) break;

        allData = allData.concat(data);

        if (data.length < pageSize) break;
        page++;
    }

    return allData;
}

/**
 * Optimized Keyset Pagination for huge datasets (where IDs are sequential and numeric)
 */
export async function fetchAllKeyset<T extends { id: number }>(
    client: SupabaseClient,
    table: string,
    select: string,
    filters: (query: any) => any = (q) => q, // callback to apply .eq, .gt, etc
    pageSize: number = 1000
): Promise<T[]> {
    let allData: T[] = [];
    let lastId = 0;
    let totalFetched = 0;

    console.log(`[Pagination] Starting Keyset Fetch on '${table}'...`);

    while (true) {
        let query = client.from(table)
            .select(select)
            .gt('id', lastId)
            .order('id', { ascending: true })
            .limit(pageSize);

        // Apply custom filters (e.g. .eq('ativo', true))
        query = filters(query);

        const { data, error } = await query;
        if (error) {
            console.error(`[Pagination] Error fetching ${table}:`, error);
            throw error;
        }

        if (!data || data.length === 0) break;

        // Type assertion
        const chunk = data as unknown as T[];
        allData = allData.concat(chunk);

        const count = chunk.length;
        totalFetched += count;
        lastId = chunk[count - 1].id;

        // Validation to prevent infinite loops if lastId doesn't move
        if (count < pageSize) break;
    }

    console.log(`[Pagination] Finished ${table}. Total: ${totalFetched}`);
    return allData;
}
