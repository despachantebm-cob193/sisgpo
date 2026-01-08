
const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

async function run() {
    try {
        console.log('--- Debugging Database Permissions ---');

        // 1. Check who has access to 'plantoes'
        console.log("Checking permissions for working table 'plantoes':");
        const grants = await knex('information_schema.role_table_grants')
            .select('grantee', 'privilege_type')
            .where({ table_name: 'plantoes', table_schema: 'public' });

        const grantees = [...new Set(grants.map(g => g.grantee))];
        console.log("Roles with access to 'plantoes':", grantees.join(', '));

        if (grantees.length === 0) {
            console.warn("⚠️ No grants found for 'plantoes'. This is unexpected if it works.");
            // Fallback to 'public'
            grantees.push('public');
        }

        // 2. Grant these roles to 'militar_plantao'
        for (const role of grantees) {
            if (role === 'postgres') continue; // Owner usually has access, no need to grant typically, but ok.

            console.log(`Granting ALL on militar_plantao to ${role}...`);
            try {
                await knex.raw(`GRANT ALL ON TABLE public.militar_plantao TO "${role}"`);
                console.log(`✅ Granted to ${role}`);
            } catch (e) {
                console.error(`❌ Failed to grant to ${role}: ${e.message}`);
            }
        }

        // Also Grant to public if list was empty or just to be safe for dev
        if (!grantees.includes('public') && !grantees.includes('anon')) {
            console.log('Granting ALL on militar_plantao to PUBLIC (fallback)...');
            await knex.raw('GRANT ALL ON TABLE public.militar_plantao TO public');
        }

        // 3. Reload Config
        console.log("Reloading PostgREST config...");
        try {
            await knex.raw("NOTIFY pgrst, 'reload config'");
            console.log("✅ Reload signal sent.");
        } catch (e) {
            console.error("❌ Failed to reload config (maybe not Supabase?):", e.message);
        }

        process.exit(0);
    } catch (err) {
        console.error('Debug permissions script error:', err);
        process.exit(1);
    }
}

run();
