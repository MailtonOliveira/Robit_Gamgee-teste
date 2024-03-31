import { NextFunction, Request, Response } from "express";
import { buy, sell } from "./orderController";
import { getBalance } from "../Controllers/balanceController";
import { WebSocketInitializer } from "../services/monitorService";
import prisma from "../database/prismaCliente";
import { buyMessage, sellMessage } from "../services/messagesService";
import { SYMBOL, STREAM_URL, ASSET, SYM, BUY_QTY } from "../Configs/config";
import { ExchangeInfoController } from "../Controllers/exchangeInfoController";

let buyExecuted = false;
let sellExecuted = false;
export class TradingViewWebhook {
  async viewWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const alertData = req.body;
      console.log(alertData);

      if (buyExecuted && alertData.condition === "buy") {
        res.status(400).send("Buy Order already executed");
        console.log("Buy Order already executed");
        return;
      } else if (sellExecuted && alertData.condition === "sell") {
        res.status(400).send("Sell Order already executed");
        console.log("Sell Order already executed");
        return;
      }

      if (alertData.condition === "buy") {
        const order = await buyOrder(alertData.symbol);
        res.status(200).send(order);
        buyExecuted = true;
        sellExecuted = false;
      } else if (alertData.condition === "sell") {
        const order = await sellOrder(alertData.symbol, res);
        res.status(200).send(order);
        sellExecuted = true;
        buyExecuted = false;
      } else {
        res
          .status(400)
          .send("Invalid alert condition or order already executed");
      }
    } catch (error) {
      return next(error);
    }
  }
}

async function buyOrder(symbol: string) {
  let wsInitializer: WebSocketInitializer | undefined;
  const orderQuantity = BUY_QTY;
  const order = await buy(symbol, orderQuantity);
  if (order.status !== "FILLED") {
    console.log(order);
    process.exit(1);
  }
  console.log(buyMessage(symbol, order.executedQty, order.fills[0].price));

  wsInitializer = new WebSocketInitializer(SYMBOL, STREAM_URL, ASSET);

  const result = await wsInitializer.updateBalances();
  const availableBalance = result.availableBalance;

  await prisma.order.create({
    data: {
      symbol,
      quantity: order.executedQty,
      price: order.fills[0].price,
      type: "BUY",
      usdtQuantity: availableBalance,
    },
  });

  return order;
}

async function sellOrder(symbol: string, res: Response) {
  let wsInitializer: WebSocketInitializer | undefined;
  const balances = await getBalance();
  const solBalance = balances.find(
    (balance: { asset: string }) => balance.asset === symbol
  );

  if (!solBalance) {
    console.error(`Failed to find balance for ${symbol}`);
    process.exit(1);
  }

  let availableQuantity = parseFloat(solBalance.free);
  availableQuantity = Math.floor(availableQuantity * 1000) / 1000;

  if (availableQuantity <= 0) {
    console.error(`Insufficient balance for ${symbol}`);
    res.status(400).send("No available quantity to sell");
    return;
  }

  const order = await sell(symbol, availableQuantity);
  if (order.status !== "FILLED") {
    console.log(order);
    process.exit(1);
  }
  console.log(sellMessage(symbol, order.executedQty, order.fills[0].price));

  wsInitializer = new WebSocketInitializer(SYMBOL, STREAM_URL, ASSET);

  const result = await wsInitializer.updateBalances();
  const availableBalance = result.availableBalance;

  await prisma.order.create({
    data: {
      symbol,
      quantity: order.executedQty,
      price: order.fills[0].price,
      type: "sell",
      usdtQuantity: availableBalance,
    },
  });

  return order;
}
