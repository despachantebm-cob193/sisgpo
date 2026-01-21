
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function testConnection() {
    console.log('--- DIAGNÓSTICO DE CONEXÃO SRE ---');
    console.log('Testando conexão administrativa com Supabase...');

    try {
        const { data, error, count } = await supabaseAdmin
            .from('militares')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('❌ ERRO DE CONEXÃO DETECTADO!');
            console.error('Código:', error.code);
            console.error('Mensagem:', error.message);
            process.exit(1);
        }

        console.log('✅ CONEXÃO COM BANCO OK');
        console.log(`Sucesso! Encontrados ${count} registros na tabela 'militares'.`);
        process.exit(0);
    } catch (err: any) {
        console.error('💥 ERRO FATAL NO SCRIPT DE TESTE:');
        console.error(err.message);
        process.exit(1);
    }
}

testConnection();
