
import 'dotenv/config';
import { supabaseAdmin } from '../config/supabase';

async function testConnection() {
    console.log('--- DB CONNECTION DIAGNOSTIC ---');
    console.log('Testing Supabase Admin connection...');

    try {
        const start = Date.now();

        // Tenta um select simples que deve funcionar em qualquer banco saudável
        const { data, error, count } = await supabaseAdmin
            .from('usuarios')
            .select('id', { count: 'exact', head: true });

        if (error) {
            console.error('❌ CONNECTION FAILED!');
            console.error('Status:', error.code || 'unknown');
            console.error('Message:', error.message);
            console.error('Details:', error.details || 'N/A');
            process.exit(1);
        }

        const duration = Date.now() - start;
        console.log('✅ CONNECTION SUCCESSFUL!');
        console.log(`Latency: ${duration}ms`);
        console.log(`Found ${count} records in 'usuarios' table.`);
        process.exit(0);

    } catch (err: any) {
        console.error('💥 FATAL ERROR DURING DIAGNOSTIC:');
        console.error(err.message);
        process.exit(1);
    }
}

testConnection();
