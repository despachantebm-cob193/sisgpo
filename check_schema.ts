import { supabaseAdmin } from './src/config/supabase';

async function checkSchema() {
    try {
        console.log('Verificando colunas da tabela "comandantes_crbm"...');

        // Tentamos fazer um select LIMIT 1 para ver as chaves retornadas
        const { data, error } = await supabaseAdmin
            .from('comandantes_crbm')
            .select('*')
            .limit(1);

        if (error) {
            console.error('Erro ao acessar tabela:', error);
            return;
        }

        if (data && data.length > 0) {
            console.log('Colunas encontradas no primeiro registro:', Object.keys(data[0]));
        } else {
            console.log('Tabela vazia ou acessível, mas sem registros para inferir colunas.');
            // Tenta inserir um teste dummy que deve falhar mas revelar colunas se o erro for descritivo,
            // ou melhor, apenas relata sucesso de conexão.
        }

        console.log('Verificação concluída.');
    } catch (err) {
        console.error('Erro script:', err);
    }
}

checkSchema();
