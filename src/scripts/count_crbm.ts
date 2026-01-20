
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function main() {
    try {
        const { data, error } = await supabaseAdmin
            .from('obms')
            .select('crbm');

        if (error) {
            console.error('Error fetching data:', error);
            process.exit(1);
        }

        if (!data) {
            console.log('No data found.');
            return;
        }

        // Extract unique CRBMs
        // Filter out null/undefined/empty
        const allCrbms = data.map(o => o.crbm).filter(c => c && c.trim() !== '');
        const uniqueCrbms = [...new Set(allCrbms)];

        // Sort them
        uniqueCrbms.sort();

        console.log(`Total active CRBMs found: ${uniqueCrbms.length}`);
        console.log('List of CRBMs:', uniqueCrbms);

    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

main();
