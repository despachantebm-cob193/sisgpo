
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
dotenv.config();

const key = process.env.GEMINI_API_KEY;
if (!key) { process.exit(1); }

const genAI = new GoogleGenerativeAI(key);

async function list() {
    console.log('--- Listing Models ---');
    try {
        // Unfortunately the Node SDK doesn't expose listModels directly easily on the main class in some versions,
        // but we can try to access the model manager if needed or just guess.
        // Actually, the SDK *does* support it via a ModelManager but let's see if we can just trigger a list.
        // The error message suggested "Call ListModels". 
        // We will try to fetch a known valid endpoint manually if the SDK hides it.

        // Actually, let's use the REST API to be sure, avoiding SDK quirks.
        const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`;
        const res = await fetch(url);
        const data = await res.json();
        console.log(JSON.stringify(data, null, 2));
    } catch (e: any) {
        console.log('Error listing:', e);
    }
}

list();
