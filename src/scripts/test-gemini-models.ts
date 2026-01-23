
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const apiKey = process.env.GEMINI_API_KEY || '';
const genAI = new GoogleGenerativeAI(apiKey);

async function test() {
    const models = [
        'gemini-2.0-flash',
        'gemini-2.0-flash-001',
        'gemini-2.0-flash-lite',
        'gemini-2.0-flash-lite-001',
        'gemini-2.5-flash',
        'gemini-2.5-flash-lite',
        'gemini-2.5-pro'
    ];

    if (!apiKey) {
        console.error('❌ GEMINI_API_KEY not set.');
        return;
    }

    for (const m of models) {
        console.log(`Testing model: ${m}...`);
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const result = await model.generateContent('Qual sua versao?');
            const response = await result.response;
            console.log(`✅ Model ${m} works! Response: ${response.text().substring(0, 30)}...`);
        } catch (err: any) {
            console.log(`❌ Model ${m} failed: ${err.message}`);
        }
    }
}

test();
