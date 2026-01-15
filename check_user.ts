
import { supabaseAdmin } from './src/config/supabase';

async function checkUserHelper() {
    const email = 'timbo.correa@gmail.com';

    console.log(`Checking users with email: ${email}`);

    const { data, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .ilike('email', `%${email}%`);

    if (error) {
        console.error('Error:', error);
        return;
    }

    console.log(`Found ${data.length} records:`);
    data.forEach((u: any) => {
        console.log(`ID: ${u.id} | Email: ${u.email} | Perfil: ${u.perfil} | Ativo: ${u.ativo} | SupabaseID: ${u.supabase_id}`);
    });
}

checkUserHelper();
