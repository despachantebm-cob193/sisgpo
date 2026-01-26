import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function fixUserEmail() {
    const oldEmail = 'admin@sisgpo.com';
    const newEmail = 'admin@cbmgo.com.br';
    console.log(`Updating user ${oldEmail} to ${newEmail}...`);

    // Update usuarios table
    const { data, error } = await supabase
        .from('usuarios')
        .update({ email: newEmail, login: 'admin.cbmgo' })
        .eq('email', oldEmail)
        .select()
        .single();

    if (error) {
        console.error('Error updating user:', error.message);
    } else {
        console.log('User updated successfully:', data);
    }
}

fixUserEmail();
