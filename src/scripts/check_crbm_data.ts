/**
 * Script para verificar dados de CRBM no sistema
 */
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function checkCrbmData() {
    console.log('🔍 Verificando dados de CRBM no sistema...\n');

    // 1. Quantos CRBMs únicos existem na tabela obms?
    const { data: obms, error: obmsErr } = await supabaseAdmin
        .from('obms')
        .select('crbm')
        .not('crbm', 'is', null);

    if (obmsErr) {
        console.error('❌ Erro ao buscar OBMs:', obmsErr.message);
        return;
    }

    // Agrupar por CRBM
    const crbmCounts: Record<string, number> = {};
    obms?.forEach(o => {
        const c = o.crbm || 'Sem CRBM';
        crbmCounts[c] = (crbmCounts[c] || 0) + 1;
    });

    console.log('📋 CRBMs encontrados na tabela OBMS:');
    Object.entries(crbmCounts)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([crbm, count]) => {
            console.log(`   ${crbm}: ${count} OBMs`);
        });

    console.log(`\n   Total de OBMs com CRBM: ${obms?.length || 0}`);

    // 2. Quantos militares por CRBM?
    console.log('\n🔍 Buscando militares por CRBM...');

    // Primeiro, criar mapa nome OBM -> CRBM
    const { data: obmsFull } = await supabaseAdmin
        .from('obms')
        .select('nome, crbm');

    const nomeToCrbm = new Map<string, string>();
    obmsFull?.forEach(o => {
        if (o.nome && o.crbm) nomeToCrbm.set(o.nome, o.crbm);
    });

    // Buscar militares
    const { data: militares } = await supabaseAdmin
        .from('militares')
        .select('obm_nome')
        .eq('ativo', true);

    const militaresPorCrbm: Record<string, number> = {};
    militares?.forEach(m => {
        const crbm = nomeToCrbm.get(m.obm_nome || '') || 'Sem CRBM';
        militaresPorCrbm[crbm] = (militaresPorCrbm[crbm] || 0) + 1;
    });

    console.log('\n📊 Militares por CRBM:');
    Object.entries(militaresPorCrbm)
        .sort((a, b) => b[1] - a[1])
        .forEach(([crbm, count]) => {
            console.log(`   ${crbm}: ${count} militares`);
        });

    console.log(`\n   Total de militares ativos: ${militares?.length || 0}`);

    // 3. Verificar se há militares com obm_nome que não está na tabela obms
    const milObmNomes = new Set(militares?.map(m => m.obm_nome).filter(Boolean));
    const obmNomes = new Set(obmsFull?.map(o => o.nome).filter(Boolean));

    const orphans = [...milObmNomes].filter(nome => !obmNomes.has(nome as string));
    if (orphans.length > 0) {
        console.log('\n⚠️ Militares com OBM_NOME que não existe na tabela OBMS:');
        orphans.forEach(nome => console.log(`   - "${nome}"`));
    }
}

checkCrbmData();
