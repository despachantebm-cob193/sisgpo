const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '..', '.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('Supabase credentials missing in .env');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupBucket() {
    console.log('Verifying storage bucket "fotos-militares"...');

    const { data: buckets, error: listError } = await supabase.storage.listBuckets();

    if (listError) {
        console.error('Error listing buckets:', listError);
        return;
    }

    const bucketExists = buckets.find(b => b.name === 'fotos-militares');

    if (bucketExists) {
        console.log('Bucket "fotos-militares" already exists.');

        // Check if public
        if (!bucketExists.public) {
            console.log('Bucket exists but is NOT public. Updating...');
            const { error: updateError } = await supabase.storage.updateBucket('fotos-militares', {
                public: true
            });
            if (updateError) console.error('Error making bucket public:', updateError);
            else console.log('Bucket updated to public.');
        }
    } else {
        console.log('Bucket not found. Creating...');
        const { data, error: createError } = await supabase.storage.createBucket('fotos-militares', {
            public: true,
            fileSizeLimit: 5242880, // 5MB
            allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp']
        });

        if (createError) {
            console.error('Error creating bucket:', createError);
        } else {
            console.log('Bucket "fotos-militares" created successfully!');
        }
    }
}

setupBucket();
