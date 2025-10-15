// sisgpo/src/routes/externalRoutes.js

const { Router } = require('express');
const { ssoAuthMiddleware } = require('../middlewares/ssoAuthMiddleware');
const dashboardController = require('../controllers/dashboardController');

const externalRoutes = Router();

externalRoutes.get('/dashboard', ssoAuthMiddleware, dashboardController.getDashboardData);

module.exports = externalRoutes;