
import { GoogleGenerativeAI } from '@google/generative-ai';
import dotenv from 'dotenv';
import AppError from '../utils/AppError';

// Load env vars
dotenv.config();

const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const GEMINI_MODEL_CANDIDATES = Array.from(
  new Set(
    [
      process.env.GEMINI_MODEL,
      // Priorizar modelos 2.5 que passaram no teste; manter variantes 2.0 como backup
      'gemini-2.5-flash',
      'gemini-2.5-flash-lite',
      'gemini-2.0-flash',
      'gemini-2.0-flash-001',
      'gemini-2.0-flash-lite',
      'gemini-2.0-flash-lite-001',
    ].filter(Boolean)
  )
);

let genAI: GoogleGenerativeAI | null = null;
let googleModel: any = null;
let currentModelName = '';

// Initialize Gemini (Primary AI Provider) using API v1
function initializeGemini() {
  if (!GEMINI_API_KEY) {
    console.error('[AI Service] 🔴 GEMINI_API_KEY não configurada no ambiente.');
    return;
  }

  try {
    // SDK atual usa v1beta; manter string para não quebrar compatibilidade.
    genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
  } catch (err: any) {
    console.error('[AI Service] 🔴 Falha ao criar cliente Gemini:', err?.message || err);
    return;
  }

  for (const modelName of GEMINI_MODEL_CANDIDATES) {
    try {
      googleModel = genAI.getGenerativeModel({ model: modelName });
      currentModelName = modelName;
      console.log(`[AI Service] 🟢 GEMINI v1 ativo. Modelo: ${modelName}. Chave: ...${GEMINI_API_KEY.slice(-4)}`);
      break;
    } catch (err: any) {
      console.error(`[AI Service] 🔴 Falha ao inicializar modelo ${modelName}:`, err?.message || err);
    }
  }

  if (!googleModel) {
    console.error('[AI Service] 🔴 Nenhum modelo Gemini pôde ser inicializado. Verifique GEMINI_MODEL/GEMINI_API_KEY.');
  }
}

initializeGemini();

/**
 * Service to handle AI-assisted operations using Google Gemini.
 */
export const aiAssistedValidationService = {

  /**
   * Internal helper to generate content from Gemini
   */
  async _generate(prompt: string): Promise<string> {
    if (!googleModel) {
      throw new Error('Serviço de IA não inicializado (Gemini faltando).');
    }

    try {
      console.log(`[AI Service] 🚀 Processando via Gemini (${currentModelName || 'desconhecido'})...`);
      const result = await googleModel.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (err: any) {
      console.error('❌ Erro no Gemini:', err?.message || err, {
        code: err?.code || err?.status || err?.statusCode,
      });

      if (err.message?.includes('429') || err?.status === 429 || err?.statusCode === 429) {
        throw new AppError('Limite de requisições da IA atingido. Tente novamente em instantes.', 429);
      }

      throw new Error(`Falha na IA: ${err.message}`);
    }
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
      let historyContext = "";
      if (history && history.length > 0) {
        historyContext = "\nHISTÓRICO RECENTE DA CONVERSA:\n" +
          history.map(m => `- ${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');
      }

      const prompt = `
        Voce é o assistente virtual do SISGPO (Sistema de Gestão do Poder Operacional) do Corpo de Bombeiros Militar de Goiás (CBMGO).
        
        GLOSSÁRIO DE PATENTES MILITARES (ignore maiúsculas/minúsculas):
        - SD ou Soldado = Soldado
        - CB ou Cabo = Cabo
        - 3º Sgt ou Terceiro Sargento = 3º Sargento
        - 2º Sgt ou Segundo Sargento = 2º Sargento
        - 1º Sgt ou Primeiro Sargento = 1º Sargento
        - ST ou Subten = Subtenente
        - 2º Ten ou Segundo Tenente = 2º Tenente
        - 1º Ten ou Primeiro Tenente = 1º Tenente
        - Cap ou Capitão = Capitão
        - Maj ou Major = Major
        - Ten Cel ou Tenente Coronel = Tenente-Coronel
        - Cel ou Coronel = Coronel
        
        Contexto do Sistema (dados atualizados):
        ${JSON.stringify(contextData, null, 2)}

        ${historyContext}

        Pergunta Atual do Usuario: "${question}"

        Resposta (seja direto, breve e informal. Vá direto ao ponto sem enrolação. Use os dados acima.):`;

      return await this._generate(prompt);
    } catch (error: any) {
      console.error('Erro Chat AI:', error);
      if (error instanceof AppError && error.statusCode === 429) {
        return "Desculpe, limite de requisições da IA atingido por agora. Tente novamente em 1 minuto.";
      }
      return `Erro técnico na infraestrutura de IA: ${error.message || error}`;
    }
  }
};

export default aiAssistedValidationService;
