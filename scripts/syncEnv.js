const fs = require('fs');
const path = require('path');

const rootEnvPath = path.resolve(__dirname, '..', '.env');
const frontendEnvPath = path.resolve(__dirname, '..', 'sisgpo-frontend', '.env.local');

console.log('Lendo .env da raiz...');

try {
    if (fs.existsSync(rootEnvPath)) {
        const content = fs.readFileSync(rootEnvPath, 'utf8');
        let newContent = '# Auto-generated from root .env\n';

        // Extrair URL e Anon Key
        const urlMatch = content.match(/^SUPABASE_URL=(.*)$/m);
        const keyMatch = content.match(/^SUPABASE_ANON_KEY=(.*)$/m);

        let found = false;

        if (urlMatch && urlMatch[1]) {
            newContent += `VITE_SUPABASE_URL=${urlMatch[1].trim()}\n`;
            console.log('✅ VITE_SUPABASE_URL encontrado.');
            found = true;
        } else {
            console.warn('⚠️ SUPABASE_URL não encontrado no .env raiz.');
        }

        if (keyMatch && keyMatch[1]) {
            newContent += `VITE_SUPABASE_ANON_KEY=${keyMatch[1].trim()}\n`;
            console.log('✅ VITE_SUPABASE_ANON_KEY encontrado.');
            found = true;
        } else {
            console.warn('⚠️ SUPABASE_ANON_KEY não encontrado no .env raiz.');
        }

        if (found) {
            fs.writeFileSync(frontendEnvPath, newContent);
            console.log(`\n🎉 Arquivo criado com sucesso em: ${frontendEnvPath}`);
        } else {
            console.log('❌ Nenhuma chave do Supabase encontrada para copiar.');
            process.exit(1);
        }
    } else {
        console.log('❌ Arquivo .env não encontrado na raiz: ' + rootEnvPath);
        process.exit(1);
    }
} catch (err) {
    console.error('Erro ao processar:', err);
    process.exit(1);
}
