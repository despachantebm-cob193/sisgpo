// src/routes/publicRoutes.js

const express = require('express');
const router = express.Router();

const path = require('path');
// Controlador original (carregando direto da pasta src para evitar artefato vazio em dist)
const dashboardController = require(path.join(process.cwd(), 'src', 'controllers', 'dashboardController'));

// Controlador de estatísticas externas
const estatisticasExternasController = require(path.join(process.cwd(), 'src', 'controllers', 'estatisticasExternasController'));

// Logs de diagnóstico para confirmar carregamento dos controllers (ping leve)
console.log('[publicRoutes] dashboardController keys:', Object.keys(dashboardController || {}));
console.log('[publicRoutes] estatisticasExternasController keys:', Object.keys(estatisticasExternasController || {}));

// Helper para evitar crashes caso algum handler não seja carregado corretamente
const safeHandler = (controller, methodName) => {
  const fn = controller?.[methodName];
  if (typeof fn === 'function') return fn;
  console.error(`[publicRoutes] Handler ausente ou inválido: ${methodName}`);
  return (_req, res) => res.status(500).json({ message: `Handler indisponível: ${methodName}` });
};

// --- ROTAS PÚBLICAS DE DASHBOARD ORIGINAIS ---
router.get('/dashboard/stats', safeHandler(dashboardController, 'getStats'));
router.get('/dashboard/viatura-stats-por-tipo', safeHandler(dashboardController, 'getViaturaStatsPorTipo'));
router.get('/dashboard/militar-stats', safeHandler(dashboardController, 'getMilitarStats'));
router.get('/dashboard/viatura-stats-detalhado', safeHandler(dashboardController, 'getViaturaStatsDetalhado'));
router.get('/dashboard/viatura-stats-por-obm', safeHandler(dashboardController, 'getViaturaStatsPorObm'));
router.get('/dashboard/servico-dia', safeHandler(dashboardController, 'getServicoDia'));
router.get('/dashboard/escala-aeronaves', safeHandler(dashboardController, 'getEscalaAeronaves'));
router.get('/dashboard/escala-codec', safeHandler(dashboardController, 'getEscalaCodec'));

// --- NOVA ROTA DE INTEGRAÇÃO ---
router.get('/estatisticas-externas', safeHandler(estatisticasExternasController, 'getDashboardOcorrencias'));

module.exports = router;
