/**
 * Quick check to verify if crbm column exists and has data
 */
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function checkCrbmColumn() {
    console.log('🔍 Verificando coluna CRBM na tabela militares...\n');

    // Try to select the crbm column
    const { data, error } = await supabaseAdmin
        .from('militares')
        .select('id, nome_completo, obm_nome, crbm')
        .limit(10);

    if (error) {
        console.error('❌ Erro:', error.message);
        console.log('\n⚠️ Se o erro indica que a coluna não existe, execute este SQL no Supabase:');
        console.log('   ALTER TABLE militares ADD COLUMN crbm VARCHAR(50);');
        return;
    }

    console.log('✅ Coluna CRBM existe! Primeiros 10 registros:');
    data?.forEach(m => {
        console.log(`   ID ${m.id}: ${m.nome_completo?.substring(0, 30)} | OBM: ${m.obm_nome} | CRBM: ${m.crbm || 'NULL'}`);
    });

    // Count how many have CRBM set
    const { count: withCrbm } = await supabaseAdmin
        .from('militares')
        .select('*', { count: 'exact', head: true })
        .not('crbm', 'is', null);

    const { count: total } = await supabaseAdmin
        .from('militares')
        .select('*', { count: 'exact', head: true });

    console.log(`\n📊 Estatísticas:`);
    console.log(`   Total de militares: ${total}`);
    console.log(`   Com CRBM preenchido: ${withCrbm}`);
    console.log(`   Sem CRBM: ${(total || 0) - (withCrbm || 0)}`);
}

checkCrbmColumn();
