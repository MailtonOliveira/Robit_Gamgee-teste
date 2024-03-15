import WebSocket from "ws";
import { getBalance } from "../Controllers/balanceController";
import { buy, sell } from "../Controllers/orderController";

export function initializeWebSocket(SYMBOL: string, STREAM_URL: string, ASSET: string, BUY_QTY: number, PROFIT: number) {
  const ws: WebSocket = new WebSocket(`${STREAM_URL}/${SYMBOL?.toLowerCase()}@bookTicker`);

  ws.on("error", handleWebSocketError);

  let buyPrice = 0;
  let quantity = 0;
  let targetPrice = 0;
  let sold = true;
  let availableBalance = 0;
  let virtualBalance = 0;

  const sales: any[] = [];

  const updateBalancesInterval = setInterval(updateBalances, 10000);

  ws.onmessage = handleMessageEvent;

  function handleWebSocketError(err: any) {
    console.error(err);
    process.exit(1);
  }

  async function updateBalances() {
    const balances = await getBalance();
    const usdtBalance = balances.find((balance: { asset: string }) => balance.asset === ASSET);
    availableBalance = parseFloat(usdtBalance?.free ?? "0");
    virtualBalance = availableBalance;
    console.log(`Real Balance ${ASSET}: ${availableBalance}`);
    console.log(`Virtual Balance ${ASSET}: ${virtualBalance}`);
  }

  async function handleMessageEvent(event: WebSocket.MessageEvent) {
    const str: string = event.data.toString();

    try {
      const obj = JSON.parse(str);
      console.clear();

      console.log(`Symbol: ${obj.s}`);
      console.log(`Best ask: ${obj.a}`);
      console.log(`Best bid: ${obj.b}`);
      console.log(`Buy Price: ${buyPrice}`);
      console.log(`Qty: ${quantity}`);
      console.log(`Notional: ${buyPrice * quantity}`);
      console.log(`Target Price: ${targetPrice}`);

      if (quantity === 0) {
        await handleNoQuantityEvent(obj);
      } else if (quantity > 0 && parseFloat(obj.b) > targetPrice) {
        await handleTargetPriceEvent(obj);
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }

  async function handleNoQuantityEvent(obj: any) {
    if (sold) {
      const bestBid = parseFloat(obj.b);
      buyPrice = bestBid;
      const fraction = BUY_QTY / bestBid;

      if (await hasSufficientBalance(fraction)) {
        const order: any = await buy(SYMBOL ?? "", BUY_QTY);
        console.log(order);
        if (order.status !== "FILLED") {
          console.log(order);
        }
        quantity = parseFloat(order.executedQty);
        buyPrice = parseFloat(order.fills[0].price);
        console.log(`Bought ${quantity} ${SYMBOL} at ${buyPrice}`);
        targetPrice = buyPrice * PROFIT;
      } else {
        console.log(`Aguardando saldo suficiente... Saldo necessário ${fraction} `);
      }
    }
  }

  async function handleTargetPriceEvent(obj: any) {
    const order: any = await sell(SYMBOL ?? "", quantity);
    if (order.status !== "FILLED") {
      console.log(order);
    } else {
      console.log(`Sold at ${new Date()} by ${order.fills[0].price}`);
      sold = true;

      const sale = {
        buyprice: parseFloat(buyPrice.toFixed(2)),
        sellprice: parseFloat(targetPrice.toFixed(2)),
        quantity: parseFloat(order.executedQty),
        time: new Date().toLocaleString(undefined, {
          year: "numeric",
          month: "numeric",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
        }),
      };

      console.log(sale);
      sales.push(sale);
      quantity = 0;
    }
  }

  async function hasSufficientBalance(fraction: number) {
    return availableBalance >= fraction * buyPrice;
  }
}
