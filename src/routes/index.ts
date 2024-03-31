import express from 'express';
import {TradingViewWebhook} from './../Controllers/webhookController';

const routes = express.Router();

const webhook = new TradingViewWebhook();

// Rota para lidar com as solicitações do webhook da TradingView
routes.post('/order', webhook.viewWebhook)

export default routes;
