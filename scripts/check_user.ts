import dotenv from 'dotenv';
dotenv.config();
import { supabaseAdmin } from '../src/config/supabase';

async function checkUser() {
    console.log('Listando todos os usuarios do sistema...');

    const { data: allUsers, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Erro ao buscar usuarios:', error);
        return;
    }

    console.table(allUsers?.map(u => ({
        id: u.id,
        login: u.login,
        email: u.email,
        perfil: u.perfil,
        ativo: u.ativo,
        status: u.status
    })));
}

checkUser();
