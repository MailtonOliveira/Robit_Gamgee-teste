import { NextFunction, Request, Response } from "express"; // Importe as definições de Request e Response
import { buy, sell } from "./orderController"; // Importe as funções de compra e venda
import { getBalance } from "../Controllers/balanceController";
import { buyOrderMessage, sellOrderMessage } from "../services/messagesService";
import dotenv from "dotenv";
dotenv.config();

let buyExecuted = false;
let sellExecuted = false;

const asset = process.env.ASSET!;

export class TradingViewWebhook {
  async viewWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const alertData = req.body;
      console.log(alertData);

      if (buyExecuted && alertData.condition === "BUY") {
        res.status(400).send("Buy Order already executed");
        return;
      } else if (sellExecuted && alertData.condition === "SELL") {
        res.status(400).send("Sell Order already executed");
        return;
      }

  
      let order;
      if (alertData.condition === "BUY") {
        const order = await buyOrder(alertData.symbol, alertData.quantity);
        res.status(200).send(order);
        buyExecuted = true;
        sellExecuted = false;
      } else if (alertData.condition === "SELL") {
        const order = await sellOrder(alertData.symbol, alertData.quantity);
        res.status(200).send(order);
        sellExecuted = true;
        buyExecuted = false;
      } else {
        res.status(400).send("Invalid alert condition or order already executed");
        return;
      }

      await updateBalances(alertData.symbol);

    } catch (error) {
      return next(error);
    }
  }
}

async function updateBalances(ASSET: string,) {
  const balances = await getBalance();
  const usdtBalance = balances.find((balance: { asset: string }) => balance.asset === "USDT");
  const availableBalance = parseFloat(usdtBalance?.free ?? "0");
  const virtualBalance = availableBalance;
  let message = `Real Balance ${asset}: ${availableBalance}\n`;
  message += `Virtual Balance ${asset}: ${virtualBalance}\n`;

  if (buyExecuted) {
    const solBalance = balances.find((balance: { asset: string }) => balance.asset === ASSET);
    const solAvailableBalance = parseFloat(solBalance?.free ?? "0");
    const solvirtualBalance = solAvailableBalance;
    console.log(`Real Balance SOL: ${solAvailableBalance}`);
    console.log(`Virtual Balance SOL: ${solvirtualBalance}`);
  }
  console.log(message);
}

async function buyOrder(symbol: string, quantity: number) {
  const order = await buy(symbol, quantity);
  if (order.status !== "FILLED") {
    console.log(order);
    process.exit(1);
  }
  console.log(buyOrderMessage(symbol, order.executedQty, order.fills[0].price));
  // console.log(`Compra realizada: ${order.executedQty} ${symbol} por ${order.fills[0].price}`);
  // console.log(`Notional: ${order.executedQty * parseFloat(order.fills[0].price)}`);
  return order;
}

async function sellOrder(symbol: string, quantity: number) {
  const order = await sell(symbol, quantity);
  if (order.status !== "FILLED") {
    console.log(order);
    process.exit(1);
  }
  console.log(sellOrderMessage(symbol, order.executedQty, order.fills[0].price));
  // console.log(`Venda realizada: ${order.executedQty} ${symbol} por ${order.fills[0].price}`);
  return order;
}
