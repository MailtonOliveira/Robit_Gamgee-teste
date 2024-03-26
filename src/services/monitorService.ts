import WebSocket from "ws";
import { getBalance } from "../Controllers/balanceController";
import { updateBalancesMessage } from "./messagesService";
import { config } from "dotenv";
config();

export function initializeWebSocket(
  SYMBOL: string,
  STREAM_URL: string,
  ASSET: string,
  SYM: string
)

{updateBalances()
  const ws: WebSocket = new WebSocket(
    `${STREAM_URL}/${SYMBOL?.toLowerCase()}@bookTicker`
  );

  ws.on("error", handleWebSocketError);

  ws.onmessage = handleMessageEvent;

  function handleWebSocketError(err: any) {
    console.error(err);
    process.exit(1);
  }
  async function updateBalances() {
    const balances = await getBalance();
    const usdtBalance = balances.find(
      (balance: { asset: string }) => balance.asset === ASSET
    );
    const availableBalance = parseFloat(usdtBalance?.free ?? "0");
    console.log(updateBalancesMessage(ASSET, availableBalance));

    const solBalance = balances.find(
      (balance: { asset: string }) => balance.asset === SYM
    );
    const solAvailableBalance = parseFloat(solBalance?.free ?? "0");
    console.log(updateBalancesMessage(SYM, solAvailableBalance));

    return availableBalance;
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
  return { updateBalances };
}
