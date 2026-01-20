
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
if (!key) {
    console.log('❌ Error: GEMINI_API_KEY not found in environment.');
    process.exit(1);
}

const genAI = new GoogleGenerativeAI(key);

async function testModel(name: string) {
    console.log(`Testing model: ${name}...`);
    const model = genAI.getGenerativeModel({ model: name });
    try {
        const res = await model.generateContent('Test');
        console.log(`✅ SUCCESS: ${name} is available.`);
        return true;
    } catch (e: any) {
        console.log(`❌ FAILED: ${name} - ${e.message}`);
        return false;
    }
}

async function run() {
    const candidates = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-1.5-flash-001',
        'gemini-pro',
        'gemini-1.0-pro',
        'gemini-1.5-pro',
        'gemini-2.0-flash-exp'
    ];

    console.log('--- Starting Model Availablity Test ---');
    for (const m of candidates) {
        await testModel(m);
    }
    console.log('--- End of Test ---');
}

run();
