
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function main() {
    try {
        const { data, error } = await supabaseAdmin
            .from('obms')
            .select('id, nome, abreviatura, crbm')
            .or('crbm.eq.1,crbm.eq.1º CRBM');

        if (error) {
            console.error('Error fetching data:', error);
            process.exit(1);
        }

        if (!data || data.length === 0) {
            console.log('No OBMs found with CRBM "1" or "1º CRBM".');
            return;
        }

        console.log('OBMs with CRBM "1":');
        data.filter(o => o.crbm === '1').forEach(o => {
            console.log(` - [ID: ${o.id}] ${o.nome} (${o.abreviatura})`);
        });

        console.log('\nOBMs with CRBM "1º CRBM":');
        data.filter(o => o.crbm === '1º CRBM').forEach(o => {
            console.log(` - [ID: ${o.id}] ${o.nome} (${o.abreviatura})`);
        });

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
