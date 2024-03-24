import { NextFunction, Request, Response } from "express"; // Importe as definições de Request e Response
import { buy, sell } from "./orderController"; // Importe as funções de compra e venda
import { getBalance } from "../Controllers/balanceController";
import prisma from "../database/prismaCliente";
import {
  updateBalancesMessage,
  buyOrderMessage,
  sellOrderMessage,
} from "../services/messagesService";
import { config } from "dotenv";
config();

let buyExecuted = false;
let sellExecuted = false;

const asset = process.env.ASSET!;

updateBalances();

export class TradingViewWebhook {
  async viewWebhook(req: Request, res: Response, next: NextFunction) {
    try {
      const alertData = req.body;
      console.log(alertData);

      const availableBalance: number = await updateBalances();

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
        const order = await sellOrder(
          alertData.symbol,
          
          availableBalance.toString()
        );
        res.status(200).send(order);
        sellExecuted = true;
        buyExecuted = false;
      } else {
        res
          .status(400)
          .send("Invalid alert condition or order already executed");
        return;
      }

      await updateBalances();
    } catch (error) {
      return next(error);
    }
  }
}

async function updateBalances() {
  const balances = await getBalance();
  const usdtBalance = balances.find(
    (balance: { asset: string }) => balance.asset === "USDT"
  );
  const availableBalance = parseFloat(usdtBalance?.free ?? "0");
  const virtualBalance = availableBalance;
  console.log(updateBalancesMessage(asset, availableBalance, virtualBalance));

  if (buyExecuted) {
    const solBalance = balances.find(
      (balance: { asset: string }) => balance.asset === "SOL"
    );
    const solAvailableBalance = parseFloat(solBalance?.free ?? "0");
    const solvirtualBalance = solAvailableBalance;
    console.log(
      updateBalancesMessage("SOL", solAvailableBalance, solvirtualBalance)
    );
  }
  return availableBalance;
}
async function buyOrder(symbol: string) {
  const orderQuantity = 1;
  const order = await buy(symbol, orderQuantity);
  if (order.status !== "FILLED") {
    console.log(order);
    process.exit(1);
  }
  console.log(buyOrderMessage(symbol, order.executedQty, order.fills[0].price));

  await prisma.order.create({
    data: {
      symbol,
      quantity: order.executedQty,
      price: order.fills[0].price,
      type: "BUY",
    },
  });

  return order;
}

async function sellOrder(symbol: string, availableBalance?: string | null) {
  const balances = await getBalance();
  const solBalance = balances.find((balance: { asset: string }) => balance.asset === symbol);
  if (!solBalance) {
    console.error(`Failed to find balance for ${symbol}`);
    process.exit(1);
  }

  const availableQuantity = parseFloat(solBalance.free);
 

  const order = await sell(symbol, availableQuantity);
  if (order.status !== "FILLED") {
    console.log(order);
    process.exit(1);
  }
  console.log(
    sellOrderMessage(symbol, order.executedQty, order.fills[0].price)
  );

  await prisma.order.create({
    data: {
      symbol,
      quantity: order.executedQty,
      price: order.fills[0].price,
      type: "sell",
      availableBalance: availableBalance,
    },
  });

  return order;
}
