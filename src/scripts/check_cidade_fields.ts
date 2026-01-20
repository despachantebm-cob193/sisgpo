/**
 * Script para verificar estrutura das tabelas e campos cidade
 */
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function checkCidadeFields() {
    console.log('🔍 Verificando campos das tabelas...\n');

    // 1. Verificar estrutura da tabela militares (pegando um registro)
    const { data: milSample, error: milErr } = await supabaseAdmin
        .from('militares')
        .select('*')
        .limit(1)
        .single();

    if (milErr) {
        console.log('❌ Erro ao buscar militar:', milErr.message);
    } else {
        console.log('📋 Campos da tabela MILITARES:');
        console.log(Object.keys(milSample || {}).join(', '));
        console.log('\n📝 Exemplo de registro:');
        console.log(milSample);
    }

    // 2. Verificar estrutura da tabela obms
    const { data: obmSample, error: obmErr } = await supabaseAdmin
        .from('obms')
        .select('*')
        .limit(1)
        .single();

    if (obmErr) {
        console.log('\n❌ Erro ao buscar OBM:', obmErr.message);
    } else {
        console.log('\n📋 Campos da tabela OBMS:');
        console.log(Object.keys(obmSample || {}).join(', '));
        console.log('\n📝 Exemplo de registro:');
        console.log(obmSample);
    }

    // 3. Listar cidades únicas em ambas as tabelas
    console.log('\n🏙️ Verificando cidades...');

    // Cidades nas OBMs
    const { data: obmCidades } = await supabaseAdmin
        .from('obms')
        .select('cidade, crbm')
        .not('cidade', 'is', null);

    const cidadeToCrbm = new Map<string, string>();
    obmCidades?.forEach(o => {
        if (o.cidade && o.crbm) {
            cidadeToCrbm.set(o.cidade.toLowerCase().trim(), o.crbm);
        }
    });

    console.log(`\n   OBMs com cidade definida: ${obmCidades?.length || 0}`);
    console.log('   Mapa cidade -> CRBM (amostra):');
    [...cidadeToCrbm.entries()].slice(0, 10).forEach(([cidade, crbm]) => {
        console.log(`      "${cidade}" -> ${crbm}`);
    });
}

checkCidadeFields();
