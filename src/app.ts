import express from 'express';
import verifySsoJwt from './middleware/verifySsoJwt';

const app = express();

app.use(express.json());

// healthcheck
app.get('/health', (_req, res) => res.json({ ok: true }));

// exemplo de rota protegida
app.get('/secure/ping', verifySsoJwt, (req, res) => {
  res.json({ ok: true, who: (req as any).ssoPayload || null });
});

export default app;
