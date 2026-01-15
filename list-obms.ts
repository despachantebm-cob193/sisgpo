
import { supabaseAdmin } from './src/config/supabase';

async function listObms() {
    const { data, error } = await supabaseAdmin
        .from('obms')
        .select('id, nome, abreviatura');

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log('Total OBMs:', data.length);
    data.forEach((obm: any) => {
        console.log(`[${obm.id}] ${obm.nome} (${obm.abreviatura})`);
    });
}

listObms();
