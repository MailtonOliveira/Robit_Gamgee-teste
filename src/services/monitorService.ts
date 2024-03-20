import WebSocket from "ws";
import { getBalance } from "../Controllers/balanceController";
import { updateBalancesMessage } from "./messagesService";

export function initializeWebSocket(
  SYMBOL: string,
  STREAM_URL: string,
  ASSET: string
) {
  const ws: WebSocket = new WebSocket(
    `${STREAM_URL}/${SYMBOL?.toLowerCase()}@bookTicker`
  );

  ws.on("error", handleWebSocketError);

  let availableBalance = 0;
  let virtualBalance = 0;

  const sales: any[] = [];

  ws.onmessage = handleMessageEvent;

  updateBalances();

  setInterval(updateBalances, 300000);

  function handleWebSocketError(err: any) {
    console.error(err);
    process.exit(1);
  }

  async function updateBalances() {
    const balances = await getBalance();
    const usdtBalance = balances.find(
      (balance: { asset: string }) => balance.asset === ASSET
    );
    availableBalance = parseFloat(usdtBalance?.free ?? "0");
    virtualBalance = availableBalance;
    console.log(updateBalancesMessage(ASSET, availableBalance, virtualBalance));
  }

  async function handleMessageEvent(event: WebSocket.MessageEvent) {
    const str: string = event.data.toString();

    try {
      const obj = JSON.parse(str);
      // console.clear();

      // console.log(`Symbol: ${obj.s}`);
      // console.log(`Best ask: ${obj.a}`);
      // console.log(`Best bid: ${obj.b}`);
    } catch (err) {
      console.error(err);
      process.exit(1);
    }
  }
}
