
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function main() {
    try {
        const { data, error } = await supabaseAdmin
            .from('obms')
            .select('id, nome, crbm')
            .in('crbm', ['1º CRBM', '1º CRMB']);

        if (error) {
            console.error('Error fetching data:', error);
            process.exit(1);
        }

        console.log('--- OBMs with "1º CRBM" (Correct?) ---');
        data?.filter(o => o.crbm === '1º CRBM').forEach(o => console.log(`[${o.id}] ${o.nome}`));

        console.log('\n--- OBMs with "1º CRMB" (Typo?) ---');
        data?.filter(o => o.crbm === '1º CRMB').forEach(o => console.log(`[${o.id}] ${o.nome}`));

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
