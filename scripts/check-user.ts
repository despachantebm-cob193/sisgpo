import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkUser() {
    console.log('Checking for users in SISGPO "usuarios" table (if it exists) or "militares"...');
    // SISGPO likely uses 'users' or 'usuarios' table for auth
    // Let's check 'users' first

    const { data: users, error } = await supabase.from('users').select('*').limit(5);
    if (error) {
        console.error('Error listing users:', error.message);
        // try usuarios
        const { data: usuarios, error: err2 } = await supabase.from('usuarios').select('*').limit(5);
        if (err2) {
            console.error('Error listing usuarios:', err2.message);
        } else {
            console.log('Found usuarios:', usuarios?.length);
            console.log(usuarios);
        }
    } else {
        console.log('Found users:', users.length);
        console.log(users);
    }

    // Check specific email
    const email = 'admin@cbmgo.com.br';
    console.log(`Checking for ${email}...`);
    const { data: specific, error: errSpecific } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

    if (specific) {
        console.log('Found specific user in users:', specific);
    } else {
        const { data: specific2 } = await supabase
            .from('usuarios')
            .select('*')
            .eq('email', email)
            .single();
        if (specific2) {
            console.log('Found specific user in usuarios:', specific2);
        } else {
            console.log('User not found in neither table.');
        }
    }
}

checkUser();
