
const { createClient } = require('@supabase/supabase-js');
const dotenv = require('dotenv');
dotenv.config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SECRET_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!SUPABASE_URL || !SUPABASE_KEY) {
    console.error("Missing Supabase Env vars");
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function run() {
    try {
        console.log("Connecting to Supabase...");
        const today = new Date().toISOString().split('T')[0];
        console.log("Querying plantoes for date:", today);

        const { data: plantoes, error } = await supabase
            .from('plantoes')
            .select(`
                id, data_plantao, 
                viatura_id, 
                obm_id,
                viaturas (prefixo),
                obms (nome, abreviatura)
            `)
            .eq('data_plantao', today);

        if (error) {
            console.error("Error fetching plantoes:", error);
            return;
        }

        console.log(`Found ${plantoes.length} plantoes.`);

        for (const p of plantoes) {
            console.log(`\nPlantao #${p.id}: VTR ${p.viaturas?.prefixo} (${p.viatura_id}) - OBM ${p.obms?.abreviatura}`);

            // Check militar_plantao relation
            const { data: guarnicao, error: gError } = await supabase
                .from('militar_plantao')
                .select('*')
                .eq('plantao_id', p.id);

            if (gError) {
                console.error("  Error fetching guarnicao:", gError);
            } else {
                console.log(`  Guarnicao Count: ${guarnicao.length}`);
                console.log('  Items:', guarnicao);
            }
        }

    } catch (e) {
        console.error("Script error:", e);
    }
}

run();
