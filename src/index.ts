import { buy, sell } from "./Controllers/orderController";
import XLSX from "xlsx";
import WebSocket from "ws";
import dotenv from "dotenv";
import { getBalance } from "./Controllers/balanceController";
const { startNgrok } = require("./Controllers/ngrokController");
dotenv.config();

const SYMBOL = process.env.SYMBOL;
const STREAM_URL = process.env.STREAM_URL;
const PROFIT: number = parseFloat(process.env.PROFIT ?? "");
const BUY_QTY: number = parseFloat(process.env.BUY_QTY ?? "0");
const ASSET = process.env.ASSET!;
const PORT = parseInt(process.env.PORT || '8080');

startNgrok(PORT).then((ngrokUrl: string) => {
  // Lógica do WebSocket e operações de compra/venda aqui
  const ws: WebSocket = new WebSocket(
    `${STREAM_URL}/${SYMBOL?.toLowerCase()}@bookTicker`
  );
  ws.on("error", (err) => {
    console.error(err);
    process.exit(1);
  });
  
  let buyPrice = 0;
  let quantity = 0;
  let targetPrice = 0;
  let sold = true;
  let availableBalance = 0;
  let virtualBalance = 0;
  //flag de verificação
  //flag de ligado/desligado
  
  const sales: any[] = [];
  
  const balance: any = getBalance().then((balances) => {
    const usdtBalance = balances.find(
      (balance: { asset: string }) => balance.asset === ASSET
    );
    const availableBalance = parseFloat(usdtBalance?.free ?? "0");
    return availableBalance;
  });
  
  balance.then((balanceValue: number) => {
    availableBalance = balanceValue;
    virtualBalance = availableBalance;
  });
  
  ws.onmessage = async (event) => {
    //buscar saldo real
    const str: string = event.data.toString();   
  
    try {
      const obj = JSON.parse(str);
      console.clear();
  
      console.log(`Real Balance ${ASSET}: ${availableBalance}`);
      console.log(`Virtual Balance ${ASSET}: ${virtualBalance}`);
      console.log(`Symbol: ${obj.s}`);
      console.log(`Best ask: ${obj.a}`);
      console.log(`Best bid: ${obj.b}`);
      console.log(`Buy Price: ${buyPrice}`);
      console.log(`Qty: ${quantity}`)
      console.log(`Notional: ${buyPrice * quantity}`);
      console.log(`Target Price: ${targetPrice}`);
  
      if (quantity === 0) {
        if (sold) {
          sold = false;
  
          const bestBid = parseFloat(obj.b);
          buyPrice = bestBid;
  
          const fraction = BUY_QTY / bestBid;
  
          const checkBalanceInterval = setInterval(async () => {
            const balanceValue = await getBalance();
            const usdtBalance = balanceValue.find(
              (balance: { asset: string }) => balance.asset === ASSET
            );
            availableBalance = parseFloat(usdtBalance?.free ?? "0");
            
            if (availableBalance >= fraction * buyPrice) {
              clearInterval(checkBalanceInterval);
              
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
          }, 10000); // Verificar o saldo a cada 10 segundos
        } else {
          console.log("Aguardando oportunidade...");
        }
        return;
      } else if (quantity > 0 && parseFloat(obj.b) > targetPrice) {
        const order: any = await sell(SYMBOL ?? "", quantity);
        if (order.status !== "FILLED") {
          console.log(order);
          quantity = 0;
          sold = true;
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
  
          const wb: XLSX.WorkBook = XLSX.utils.book_new();
          const wc: XLSX.WorkSheet = XLSX.utils.json_to_sheet(sales);
          wc["!cols"] = [
            { width: 12 },
            { width: 12 },
            { width: 16 },
            { width: 20 },
          ];
          wc["A1"].v = "Compra";
          wc["B1"].v = "Venda";
          wc["C1"].v = "Quantidade";
          wc["D1"].v = "Data";
          XLSX.utils.book_append_sheet(wb, wc, "Vendas-teste");
          XLSX.writeFile(wb, "vendas-teste.xlsx");
  
          quantity = 0;
        }
        return;
      }
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  };


}).catch((err: any)=> {
  console.error('Error starting Ngrok:', err);
});


