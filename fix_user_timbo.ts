
import { supabaseAdmin } from './src/config/supabase';

async function fixUser() {
    const email = 'timbo.correa@gmail.com';

    // 1. Find all users with this email
    const { data: users, error } = await supabaseAdmin
        .from('usuarios')
        .select('*')
        .ilike('email', `%${email}%`);

    if (error || !users) {
        console.error('Error fetching users:', error);
        return;
    }

    console.log(`Found ${users.length} users for ${email}`);

    // 2. Identify the "correct" user (likely the one with Admin profile or existing ID)
    // Logic: Prefer admin, then older ID.
    const adminUser = users.find(u => u.perfil === 'admin');
    const targetUser = adminUser || users[0];

    if (!targetUser) {
        console.log('No user found to fix.');
        return;
    }

    console.log(`Targeting user ID: ${targetUser.id} (${targetUser.email}) - Current Profile: ${targetUser.perfil}`);

    // 3. Update to Admin
    if (targetUser.perfil !== 'admin') {
        const { error: updateError } = await supabaseAdmin
            .from('usuarios')
            .update({ perfil: 'admin', ativo: true })
            .eq('id', targetUser.id);

        if (updateError) console.error('Error updating profile:', updateError);
        else console.log('Successfully updated profile to ADMIN.');
    } else {
        console.log('User is already ADMIN.');
    }

    // 4. Handle duplicates (if any)
    const duplicates = users.filter(u => u.id !== targetUser.id);
    if (duplicates.length > 0) {
        console.log(`Found ${duplicates.length} duplicates. Deleting...`);
        for (const dup of duplicates) {
            const { error: delError } = await supabaseAdmin.from('usuarios').delete().eq('id', dup.id);
            if (delError) console.error(`Failed to delete dup ${dup.id}:`, delError);
            else console.log(`Deleted duplicate user ${dup.id}`);
        }
    }
}

fixUser();
