
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';
import axios from 'axios';

async function diagnose() {
    console.log('--- DIAGNOSTIC SERVICO DIA ---');

    // 1. Fetch raw Servico Dia directly from DB
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0)).toISOString();
    const endOfDay = new Date(today.setHours(23, 59, 59, 999)).toISOString();

    console.log(`Searching for service between ${startOfDay} and ${endOfDay}`);

    const { data: servicos } = await supabaseAdmin
        .from('servico_dia')
        // .select('*') // Select all to debug
        .select(`
            id,
            funcao,
            pessoa_id, 
            pessoa_type,
            data_inicio,
            data_fim
        `)
        .lte('data_inicio', endOfDay)
        .gte('data_fim', startOfDay)
        .order('data_inicio', { ascending: false });

    console.log(`Found ${servicos?.length || 0} direct DB records.`);

    if (servicos && servicos.length > 0) {
        // console.table(servicos);

        const ids = servicos.filter((s: any) => s.pessoa_type === 'militar').map((s: any) => s.pessoa_id);
        console.log('Militar IDs explicitly found:', ids);

        if (ids.length > 0) {
            const { data: militares } = await supabaseAdmin
                .from('militares')
                .select('id, nome_guerra, posto_graduacao')
                .in('id', ids);

            console.log(`Found ${militares?.length || 0} corresponding records in 'militares' table.`);

            // Check for missing
            const foundIds = new Set(militares?.map((m: any) => m.id));
            const missing = ids.filter((id: number) => !foundIds.has(id));

            if (missing.length > 0) {
                console.error('❌ CRITICAL: The following IDs exist in servico_dia but NOT in militares:', missing);
            } else {
                console.log('✅ All IDs resolved correctly.');
            }
        }
    }

    // 2. Fetch via API
    try {
        const apiUrl = 'http://localhost:3333/api/public/dashboard/servico-dia';
        console.log(`\nFetching from API: ${apiUrl}`);
        const res = await axios.get(apiUrl);
        console.log(`API returned ${res.data.length} items.`);
        if (res.data.length > 0) {
            // Check the first few for N/A
            const problematic = res.data.filter((i: any) => i.nome_guerra === 'N/A');
            if (problematic.length > 0) {
                console.error(`❌ API returned ${problematic.length} items with 'N/A' nome_guerra.`);
                console.log('Sample Problematic:', problematic[0]);
            } else {
                console.log('✅ API data looks healthy (no N/A).');
            }
        }
    } catch (e: any) {
        console.error('API Fetch failed:', e.message);
    }
}

diagnose();
