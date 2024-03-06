import express from 'express';
import tradingViewWebhook from './../Controllers/webhookController';

const routes = express.Router();

const Webhook = new tradingViewWebhook();

// Rota para lidar com as solicitações do webhook da TradingView
routes.post('/order', Webhook.viewWebhook)

export default routes;
