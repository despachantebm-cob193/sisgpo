
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');

async function listModels() {
    try {
        const result = await genAI.getGenerativeModel({ model: 'gemini-1.5-flash' }).listModels();
        // Wait, listModels is on the genAI object or a specific model?
        // In @google/generative-ai, listModels is not easily accessible via genAI.
        // Actually, I can just try different names.
        console.log('Testing names...');
    } catch (e) {
        console.error(e);
    }
}

// Correct way to list models in @google/generative-ai is actually via the REST API or Vertex AI.
// For the SDK, we usually just use the strings.
// Common strings:
// 'gemini-1.5-flash'
// 'gemini-1.5-flash-latest'
// 'gemini-1.5-pro'
// 'gemini-2.0-flash-exp'
// 'gemini-2.0-flash-lite'

async function test() {
    const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-pro', 'gemini-2.0-flash-lite-preview-02-05'];
    for (const m of models) {
        try {
            const model = genAI.getGenerativeModel({ model: m });
            const res = await model.generateContent('hi');
            console.log(`✅ Model ${m} works!`);
            break;
        } catch (err: any) {
            console.log(`❌ Model ${m} failed: ${err.message}`);
        }
    }
}

test();
