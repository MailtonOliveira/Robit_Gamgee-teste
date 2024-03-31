import WebSocket from "ws";
import { getBalance } from "../Controllers/balanceController";
import { updateMessage } from "../services/messagesService";
import { config } from "dotenv";
config();

export class WebSocketInitializer {
  ws: WebSocket;
  SYMBOL: string;
  ASSET: string;

  constructor(SYMBOL: string, STREAM_URL: string, ASSET: string) {
    this.SYMBOL = SYMBOL;
    this.ASSET = ASSET;
    this.ws = new WebSocket(
      `${STREAM_URL}/${SYMBOL?.toLowerCase()}@bookTicker`
    );
    this.ws.on("error", this.handleWebSocketError.bind(this));
    this.ws.onmessage = this.handleMessageEvent.bind(this);
  }

  handleWebSocketError(err: any) {
    console.error(err);
    process.exit(1);
  }

  async updateBalances() {
    const balances = await getBalance();
    const usdtBalance = balances.find(
      (balance: { asset: string }) => balance.asset === this.ASSET
    );
    const availableBalance = parseFloat(usdtBalance?.free ?? "0");
    console.log(updateMessage(this.ASSET, availableBalance));

    const solBalance = balances.find(
      (balance: { asset: string }) => balance.asset === this.SYMBOL
    );
    const solAvailableBalance = parseFloat(solBalance?.free ?? "0");
    console.log(updateMessage(this.SYMBOL, solAvailableBalance));
    return { availableBalance, solAvailableBalance };
  }

  async handleMessageEvent(event: WebSocket.MessageEvent) {
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

  start() {
    return this;
  }

  stop() {
    this.ws.close();
  }
}
