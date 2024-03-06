import { NextFunction, Request, Response } from 'express'; // Importe as definições de Request e Response
import { buy, sell } from "./orderController"; // Importe as funções de compra e venda
import dotenv from "dotenv";
dotenv.config();

// Função para lidar com o webhook da TradingView
class TradingViewWebhook {
  async  viewWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      // Verifique se a solicitação contém os dados necessários do webhook
      const alertData = req.body;
      console.log(alertData) // Supondo que os dados do webhook estejam no corpo da solicitação
      
  
      // Lógica para determinar se deve comprar ou vender com base nos dados do webhook
      if (alertData.condition === 'BUY') {
        const order = await buy(alertData.symbol, alertData.quantity);
        res.status(200).send(order);
      } else if (alertData.condition === 'SELL') {
        const order = await sell(alertData.symbol, alertData.quantity);
        res.status(200).send(order);
      } else {
        // Caso a condição do alerta não seja reconhecida
        res.status(400).send('Invalid alert condition');
      }
    } catch (error) {
      return next(error)
    }
  }

}

export default TradingViewWebhook;

