// Arquivo: src/app.ts (CORRIGIDO)
import 'dotenv/config';
import express from 'express';
import 'express-async-errors';
import cors from 'cors';
import path from 'path';

// --- Importação das Rotas ---
// (Assumindo que os arquivos de rotas são .js, o import funciona)
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import estatisticasExternasRoutes from './routes/estatisticasExternasRoutes';
import dashboardRoutes from './routes/dashboardRoutes';

// --- Importação dos Middlewares ---
import authMiddleware from './middlewares/authMiddleware';
import errorMiddleware from './middlewares/errorMiddleware';

const app = express();

// DEFINE O CAMINHO CORRETO DA PASTA DE BUILD DO FRONTEND
// __dirname não existe por padrão em módulos ES, mas 'tsc' deve lidar com isso.
// Se der erro, trocaremos esta parte.
const frontendPath = path.join(__dirname, '..', 'sisgpo-frontend', 'dist');

// Configuração do CORS (Lendo a variável de ambiente e permitindo localhost)
const allowedOrigins = [
  ...(process.env.FRONTEND_URL ? process.env.FRONTEND_URL.split(',') : []),
  // Domínio do frontend publicado (default)
  'https://sisgpo.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000', 
].filter(Boolean); 

// Permitir subdominios do Render via flag para evitar bloqueios nao intencionais
const allowRenderOrigins = process.env.ALLOW_RENDER_ORIGINS !== 'false';
const isAllowedOrigin = (origin: string) => {
  try {
    const hostname = new URL(origin).hostname;
    if (allowRenderOrigins && (hostname.endsWith('.onrender.com') || hostname === 'localhost')) {
      return true;
    }
  } catch (e) {
    // ignora erros de parsing
  }
  return allowedOrigins.includes(origin);
};

app.use(cors({
  origin: (origin, callback) => {

    // Permite requisições sem 'origin' (ex: Postman, apps mobile)
    if (!origin) return callback(null, true);
    
    // Se a origem da requisição estiver na lista de permitidas, autorize.
    if (isAllowedOrigin(origin)) {
      return callback(null, true);
    }
    
    // Caso contrário, rejeite.
    return callback(new Error('A política de CORS para este site não permite acesso a partir da sua origem.'), false);
  },
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  preflightContinue: false,
  optionsSuccessStatus: 204
}));

app.use(express.json());

// Rota leve para monitoramento de atividade (keep-alive)
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is alive',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.json({ message: 'API do SISGPO está funcionando!' });
});

// --- REGISTRO DAS ROTAS DA API ---

// Rotas de Autenticação (PÚBLICAS)
app.use('/api/auth', authRoutes);

// Rotas do Dashboard (PROTEGIDAS POR AUTENTICAÇÃO)
app.use('/api/dashboard', authMiddleware, dashboardRoutes);

// Rotas do Dashboard (PÚBLICAS)
app.use('/api/public', publicRoutes);

// Nova rota para a integração
app.use('/api', estatisticasExternasRoutes);

// Rotas de Administração (PROTEGIDAS)
app.use('/api/admin', authMiddleware, adminRoutes);

// ------------------------------------------------------------------------------------------
// --- SERVINDO O FRONTEND (SPA HISTORY FALLBACK) ---
// ------------------------------------------------------------------------------------------

// 1. Serve os arquivos estáticos (CSS, JS, imagens)
app.use(express.static(frontendPath));

// 2. Rota Catch-All para o SPA (fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

// Middleware de erro deve ser o último
app.use(errorMiddleware);

export default app; // Alterado de module.exports para export default
