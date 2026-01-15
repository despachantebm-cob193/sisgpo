
import { supabaseAdmin } from './src/config/supabase';

async function checkSchema() {
    const { data, error } = await supabaseAdmin
        .from('plantoes')
        .select('*')
        .limit(1);

    if (error) {
        console.error('Error fetching data:', error);
        return;
    }

    if (data && data.length > 0) {
        console.log('Columns found in a record:', Object.keys(data[0]));
    } else {
        console.log('No records found to inspect columns. Trying empty insert to force error with columns...');
        const { error: insertError } = await supabaseAdmin.from('plantoes').insert({}).select();
        if (insertError) console.log('Insert error showing schema:', insertError)
    }
}

checkSchema();
