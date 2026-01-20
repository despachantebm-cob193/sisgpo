
import 'dotenv/config';
import express, { ErrorRequestHandler, Request, RequestHandler, Response } from 'express';
import 'express-async-errors';
import cors from 'cors';
import path from 'path';

import env from './config/env';
import authRoutes from './routes/authRoutes';
import adminRoutes from './routes/adminRoutes';
import publicRoutes from './routes/publicRoutes';
import estatisticasExternasRoutes from './routes/estatisticasExternasRoutes';
import dashboardRoutes from './routes/dashboardRoutes';
import authMiddleware from './middlewares/authMiddleware';
import errorMiddleware from './middlewares/errorMiddleware';
import aiRoutes from './routes/aiRoutes';

const app = express();

const frontendPath = path.join(__dirname, '..', 'sisgpo-frontend', 'dist');

const allowedOrigins = [
  ...env.FRONTEND_URLS,
  'https://sisgpo.vercel.app',
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
].filter(Boolean);

const allowRenderOrigins = env.ALLOW_RENDER_ORIGINS;

const isAllowedOrigin = (origin: string): boolean => {
  try {
    const hostname = new URL(origin).hostname;
    if (allowRenderOrigins && (hostname.endsWith('.onrender.com') || hostname === 'localhost')) {
      return true;
    }
  } catch (error) {
    // ignore parse errors
  }

  return allowedOrigins.includes(origin);
};

app.use((req, res, next) => {
  console.log(`[Request] ${req.method} ${req.url}`);
  next();
});

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (isAllowedOrigin(origin)) return callback(null, true);
      return callback(new Error('CORS policy does not allow access from this origin.'), false);
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204,
  }),
);

app.use(express.json());

app.get('/health', (_req: Request, res: Response) => {
  res.status(200).json({
    status: 'ok',
    message: 'API is alive',
    timestamp: new Date().toISOString(),
  });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({ message: 'API do SISGPO esta funcionando!' });
});

const authHandler = authMiddleware as unknown as RequestHandler;
const errorHandler = errorMiddleware as unknown as ErrorRequestHandler;

app.use('/api/auth', authRoutes);
app.use('/api/dashboard', authHandler, dashboardRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/ai', authHandler, aiRoutes); // Protected route
app.use('/api', estatisticasExternasRoutes);
app.use('/api/admin', authHandler, adminRoutes);

app.use(express.static(frontendPath));

app.get('*', (_req: Request, res: Response) => {
  res.sendFile(path.join(frontendPath, 'index.html'));
});

app.use(errorHandler);

export default app;
