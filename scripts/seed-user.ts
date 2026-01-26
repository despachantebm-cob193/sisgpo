import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

async function seedUser() {
    const email = 'admin@cbmgo.com.br';
    const password = 'Cbmgo-Admin@2026';
    console.log(`Seeding user ${email}...`);

    let supabaseId = '';

    // 1. Create in Supabase Auth
    const { data: authUser, error: authError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: { login: 'admin.cbmgo' }
    });

    if (authError) {
        // console.error('Error creating auth user:', authError.message);
        if (authError.message.includes('already registered') || authError.status === 422) {
            console.log('User likely already exists in Auth. Fetching ID...');
            const { data: userList } = await supabase.auth.admin.listUsers();
            if (userList?.users) {
                const found = userList.users.find(u => u.email === email);
                if (found) {
                    supabaseId = found.id;
                    console.log('Found existing Auth ID:', supabaseId);
                }
            }
        } else {
            console.error('Critical Auth Error:', authError);
            return;
        }
    } else if (authUser?.user) {
        supabaseId = authUser.user.id;
        console.log('Auth user created:', supabaseId);
    }

    if (!supabaseId) {
        console.error('Failed to obtain supabase_id.');
        return;
    }

    const newUser = {
        login: 'admin.cbmgo',
        senha_hash: '$2a$10$UbAhkmUucRwl8Q6IFlWl2.YxcAr8J982t9qq1n0oCbflLpebsYRom', // recycled hash
        perfil: 'admin',
        ativo: true,
        email: email,
        nome: 'Admin CBMGO (SSO)',
        nome_completo: 'Administrador CBMGO Integrado',
        supabase_id: supabaseId,
        status: 'approved',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
        .from('usuarios')
        .insert(newUser)
        .select()
        .single();

    if (error) {
        if (error.code === '23505') { // Unique violation
            console.log('User already exists in usuarios table. Updating...');
            const { data: updated, error: updateError } = await supabase
                .from('usuarios')
                .update({ supabase_id: supabaseId, ativo: true })
                .eq('email', email)
                .select()
                .single();
            if (updateError) console.error('Error updating:', updateError.message);
            else console.log('User updated:', updated);
        } else {
            console.error('Error seeding user:', error.message);
        }
    } else {
        console.log('User seeded successfully:', data);
    }
}

seedUser();
