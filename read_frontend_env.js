const fs = require('fs');
const path = require('path');

try {
    const envPath = path.resolve(__dirname, 'sisgpo-frontend', '.env.local');
    if (fs.existsSync(envPath)) {
        console.log('--- CONTENT START ---');
        console.log(fs.readFileSync(envPath, 'utf8'));
        console.log('--- CONTENT END ---');
    } else {
        console.log('File not found at:', envPath);
    }
} catch (err) {
    console.error('Error reading file:', err);
}
