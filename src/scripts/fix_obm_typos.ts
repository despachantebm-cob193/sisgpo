
import { supabaseAdmin } from '../config/supabase';

async function fixTypos() {
    console.log('🔍 Iniciando verificação e correção de typos na coluna CRBM...');

    const { data: obms, error } = await supabaseAdmin.from('obms').select('id, nome, crbm');

    if (error) {
        console.error('❌ Erro ao buscar OBMs:', error);
        return;
    }

    if (!obms) return;

    let fixedCount = 0;

    for (const obm of obms) {
        if (obm.crbm && obm.crbm.includes('CRMB')) {
            const novoCrbm = obm.crbm.replace('CRMB', 'CRBM');
            console.log(`🔧 Corrigindo [${obm.nome}]: '${obm.crbm}' -> '${novoCrbm}'`);

            const { error: updateError } = await supabaseAdmin
                .from('obms')
                .update({ crbm: novoCrbm })
                .eq('id', obm.id);

            if (updateError) {
                console.error(`   ❌ Falha ao atualizar: ${updateError.message}`);
            } else {
                fixedCount++;
            }
        }
    }

    console.log(`\n✅ Processo finalizado. ${fixedCount} OBMs corrigidas.`);
}

fixTypos();
