
import { GoogleGenerativeAI } from '@google/generative-ai';
import Groq from 'groq-sdk';
import dotenv from 'dotenv';
import AppError from '../utils/AppError';

// Load env vars if not already loaded (though server usually loads them)
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GROQ_API_KEY = process.env.GROQ_API_KEY;

let genAI: GoogleGenerativeAI | null = null;
let googleModel: any = null;
let groqClient: Groq | null = null;

// Initialize Groq if Key Exists (Priority if set/requested)
if (GROQ_API_KEY) {
  console.log(`[AI Service] 🟢 GROQ (Llama) ATIVO. Chave: ...${GROQ_API_KEY.slice(-4)}`);
  groqClient = new Groq({ apiKey: GROQ_API_KEY });
} else {
  console.log('[AI Service] 🔴 GROQ API Key não encontrada. Tentando fallback para Gemini...');
}

// Fallback or Alternative: Initialize Gemini
if (GEMINI_API_KEY) {
  genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  // Using 2.0 Flash Lite as it is available for this user key
  googleModel = genAI.getGenerativeModel({ model: 'gemini-2.0-flash-lite' });
  console.log(`[AI Service] 🟡 GEMINI ATIVO (Fallback). Chave: ...${GEMINI_API_KEY.slice(-4)}`);
}

/**
 * Service to correct typos using AI (Groq/Llama or Gemini).
 */
export const aiAssistedValidationService = {

  /**
   * Helper to generate content from active provider
   */
  async _generate(prompt: string): Promise<string> {
    // 1. Try Gemini (Primary)
    if (googleModel) {
      try {
        console.log('[AI Service] 🚀 Tentando resposta via Gemini 2.0...');
        const result = await googleModel.generateContent(prompt);
        const response = await result.response;
        return response.text();
      } catch (geminiErr: any) {
        console.warn('⚠️ Erro no Gemini:', geminiErr.message);
        // Fallthrough to Groq
      }
    }

    // 2. Try Groq (Llama) - Fallback
    if (groqClient) {
      try {
        console.log('[AI Service] 🔄 Tentando resposta via Groq (Llama 3 Fallback)...');
        const chatCompletion = await groqClient.chat.completions.create({
          messages: [{ role: 'user', content: prompt }],
          model: 'llama-3.3-70b-versatile',
          temperature: 0.2,
        });
        return chatCompletion.choices[0]?.message?.content || '';
      } catch (err: any) {
        console.error('❌ Erro no Groq/Llama:', err.message);
        throw err; // If both fail
      }
    }

    // If we get here, neither worked
    throw new Error('Falha em ambos serviços de IA (Gemini e Groq).');

    throw new Error('Nenhum serviço de IA configurado ou disponível (Groq/Gemini).');
  },

  /**
   * Corrects a given text string based on a specific context.
   */
  async correctText(input: string, contextDescription: string): Promise<string> {
    try {
      const prompt = `
        Voce é um assistente especialista em corrigir erros de digitação para um sistema do Corpo de Bombeiros Militar (CBM).
        O texto de entrada é um campo do tipo: "${contextDescription}".
        A entrada atual é: "${input}".
        Tarefa: Se houver erro de digitação (ex: "CRMB" em vez de "CRBM"), corrija. Se nao, mantenha.
        Retorne APENAS o texto corrigido.
      `;

      return (await this._generate(prompt)).trim().replace(/^"|"$/g, '');
    } catch (error) {
      console.error('Erro ao corrigir texto via AI:', error);
      return input;
    }
  },

  /**
   * Specific correction for OBM/CRBM fields logic.
   */
  async correctObmData(nome: string, abreviatura: string, crbm?: string | null): Promise<{ nome: string; abreviatura: string; crbm?: string | null }> {
    try {
      const prompt = `
        Analise e corrija typos nestes dados de bombeiros (OBM).
        Siglas Corretas: CRBM (não CRMB), BBM, OBM.
        Dados:
        Nome: "${nome}"
        Abreviatura: "${abreviatura}"
        CRBM: "${crbm || ''}"
        
        Responda APENAS um JSON válido com chaves: "nome", "abreviatura", "crbm".
      `;

      let text = await this._generate(prompt);
      // Clean up markdown code blocks if Llama adds them
      text = text.replace(/```json/g, '').replace(/```/g, '').trim();

      const parsed = JSON.parse(text);
      return {
        nome: parsed.nome || nome,
        abreviatura: parsed.abreviatura || abreviatura,
        crbm: parsed.crbm || crbm
      };
    } catch (error) {
      console.warn('Falha AI OBM:', error);
      return { nome, abreviatura, crbm };
    }
  },

  /**
   * Responds to a user query about the system.
   */
  async answerSystemQuery(question: string, contextData: any, history?: any[]): Promise<string> {
    try {
      // Format history (if available) for the prompt
      let historyContext = "";
      if (history && history.length > 0) {
        historyContext = "\nHISTÓRICO RECENTE DA CONVERSA:\n" +
          history.map(m => `- ${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');
      }

      const prompt = `
        Voce é o assistente virtual do SISGPO (CBMGO).
        Contexto do Sistema:
        ${JSON.stringify(contextData, null, 2)}

        ${historyContext}

        Pergunta Atual do Usuario: "${question}"

        Resposta (seja direto, breve e informal. Vá direto ao ponto sem enrolação. Use os dados acima.):
      `;

      return await this._generate(prompt);
    } catch (error: any) {
      console.error('Erro Chat AI:', error);
      if (error && (error.status === 429 || (error.message && error.message.includes('429')))) {
        return "Desculpe, limite de IA atingido por hoje.";
      }
      return `Erro técnico na IA: ${error.message || error}`;
    }
  }
};

export default aiAssistedValidationService;
