/**
 * Script para corrigir typos de "CRMB" para "CRBM" no banco de dados
 */
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function fixCrbmTypos() {
    console.log('🔍 Buscando registros com CRMB (typo)...\n');

    // 1. Buscar registros com o typo na tabela obms
    const { data: obmsComTypo, error: errObm } = await supabaseAdmin
        .from('obms')
        .select('id, crbm, nome, abreviatura')
        .ilike('crbm', '%CRMB%');

    if (errObm) {
        console.error('❌ Erro ao buscar OBMs:', errObm.message);
        return;
    }

    console.log(`📋 Encontrados ${obmsComTypo?.length || 0} OBMs com o typo "CRMB":`);
    obmsComTypo?.forEach(o => console.log(`   - ID ${o.id}: ${o.abreviatura} | CRBM atual: "${o.crbm}"`));

    if (!obmsComTypo || obmsComTypo.length === 0) {
        console.log('\n✅ Nenhum typo "CRMB" encontrado na tabela obms!');
        return;
    }

    // 2. Corrigir cada registro
    console.log('\n🛠️ Corrigindo...');
    let corrigidos = 0;

    for (const obm of obmsComTypo) {
        const crbmCorrigido = obm.crbm?.replace(/CRMB/gi, 'CRBM');

        const { error: errUpdate } = await supabaseAdmin
            .from('obms')
            .update({ crbm: crbmCorrigido })
            .eq('id', obm.id);

        if (errUpdate) {
            console.error(`   ❌ Erro ao corrigir ID ${obm.id}:`, errUpdate.message);
        } else {
            console.log(`   ✅ ID ${obm.id}: "${obm.crbm}" → "${crbmCorrigido}"`);
            corrigidos++;
        }
    }

    console.log(`\n🎉 Concluído! ${corrigidos} registros corrigidos.`);
}

fixCrbmTypos();
