/**
 * Script para adicionar coluna CRBM na tabela militares
 * e popular baseado no match obm_nome <-> abreviatura da OBM
 */
import dotenv from 'dotenv';
dotenv.config();

import { supabaseAdmin } from '../config/supabase';

async function addCrbmToMilitares() {
    console.log('🔧 Adicionando coluna CRBM aos militares...\n');

    // 1. Criar mapa de abreviatura -> crbm
    const { data: obms, error: obmsErr } = await supabaseAdmin
        .from('obms')
        .select('abreviatura, nome, crbm');

    if (obmsErr) {
        console.error('❌ Erro ao buscar OBMs:', obmsErr.message);
        return;
    }

    // Criar múltiplos mapeamentos para flexibilidade
    const abrevToCrbm = new Map<string, string>();
    const nomeToCrbm = new Map<string, string>();

    obms?.forEach(o => {
        if (o.crbm) {
            // Por abreviatura (ex: "COB" -> "1º CRBM")
            if (o.abreviatura) {
                abrevToCrbm.set(o.abreviatura.toUpperCase().trim(), o.crbm);
            }
            // Por nome completo (ex: "Centro Operacional de Bombeiros - COB" -> "1º CRBM")
            if (o.nome) {
                nomeToCrbm.set(o.nome.toUpperCase().trim(), o.crbm);
            }
        }
    });

    console.log(`📋 Mapeamentos criados: ${abrevToCrbm.size} abreviaturas, ${nomeToCrbm.size} nomes`);

    // 2. Buscar todos os militares ativos
    let allMilitares: any[] = [];
    let configRange = 0;
    const pageSize = 1000;
    let fetchMore = true;

    while (fetchMore) {
        const { data, error } = await supabaseAdmin
            .from('militares')
            .select('id, obm_nome')
            .range(configRange, configRange + pageSize - 1);

        if (error) {
            console.error('❌ Erro ao buscar militares:', error.message);
            return;
        }

        if (data && data.length > 0) {
            allMilitares = [...allMilitares, ...data];
            configRange += pageSize;
            if (data.length < pageSize) fetchMore = false;
        } else {
            fetchMore = false;
        }
    }

    console.log(`👥 Total de militares a processar: ${allMilitares.length}`);

    // 3. Determinar CRBM para cada militar
    let updated = 0;
    let notFound = 0;
    const notFoundObms = new Set<string>();

    for (const mil of allMilitares) {
        const obmNome = mil.obm_nome?.toUpperCase().trim() || '';

        // Tentar encontrar CRBM
        let crbm = abrevToCrbm.get(obmNome) || nomeToCrbm.get(obmNome);

        // Se não encontrou, tentar match parcial (ex: "1º BBM / BOPAR" contém "1º BBM")
        if (!crbm) {
            for (const [abrev, c] of abrevToCrbm.entries()) {
                if (obmNome.includes(abrev) || abrev.includes(obmNome.replace(/ /g, ''))) {
                    crbm = c;
                    break;
                }
            }
        }

        if (crbm) {
            // Atualizar o militar com o CRBM
            const { error: updateErr } = await supabaseAdmin
                .from('militares')
                .update({ crbm: crbm })
                .eq('id', mil.id);

            if (updateErr) {
                // Se a coluna não existe, precisamos criar via SQL
                if (updateErr.message.includes('column') || updateErr.code === '42703') {
                    console.log('\n⚠️ Coluna CRBM não existe. Execute o seguinte SQL no Supabase:');
                    console.log('   ALTER TABLE militares ADD COLUMN crbm VARCHAR(50);');
                    console.log('\nDepois rode este script novamente.');
                    return;
                }
                console.error(`❌ Erro ao atualizar militar ${mil.id}:`, updateErr.message);
            } else {
                updated++;
            }
        } else {
            notFound++;
            if (mil.obm_nome) notFoundObms.add(mil.obm_nome);
        }
    }

    console.log(`\n✅ Atualizados: ${updated} militares`);
    console.log(`⚠️ Sem CRBM encontrado: ${notFound} militares`);

    if (notFoundObms.size > 0) {
        console.log(`\n📋 OBMs que não foram mapeadas (${notFoundObms.size}):`);
        [...notFoundObms].slice(0, 20).forEach(o => console.log(`   - ${o}`));
        if (notFoundObms.size > 20) console.log(`   ... e mais ${notFoundObms.size - 20}`);
    }
}

addCrbmToMilitares();
