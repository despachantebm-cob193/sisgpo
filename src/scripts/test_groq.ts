
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GROQ_API_KEY;

console.log('--- TESTE DE CONEXÃO GROQ (LLAMA) ---');

if (!key) {
    console.log('❌ ERRO: A chave GROQ_API_KEY não foi encontrada no ambiente.');
    console.log('Verifique se você salvou o arquivo .env');
    process.exit(1);
}

console.log(`🔑 Chave detectada: ...${key.slice(-4)}`);

const groq = new Groq({ apiKey: key });

async function run() {
    try {
        console.log('⏳ Enviando teste para Llama 3...');
        const chatCompletion = await groq.chat.completions.create({
            messages: [{ role: 'user', content: 'Responda apenas com a palavra: FUNCIONANDO' }],
            model: 'llama-3.3-70b-versatile',
        });

        console.log(`✅ RESPOSTA RECEBIDA: ${chatCompletion.choices[0]?.message?.content}`);
        console.log('🎉 O sistema está pronto para usar Llama!');
    } catch (e: any) {
        console.log('❌ ERRO NA CHAMADA API:', e.message);
    }
}

run();
