import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

interface NewOrderData {
  recvWindow?: number;
  timestamp?: number;
  symbol?: string;
  type?: string;
  side: string;
  quantity?: number;
  price?: string;
  timeInForce?: string;
  quoteOrderQty?: number;
  priceLimit?: number;
  asset?: string;
  free?: string;
  locked?: string;
}

const apiKey = process.env.API_KEY!;
const apiSecret = process.env.SECRET_KEY!;
const apiUrl = process.env.API_URL!;
const symbol = process.env.SYMBOL;
const ASSET = process.env.ASSET!;

async function newOrder(data: NewOrderData) {
  if (!apiKey || !apiSecret) {
    throw new Error("Preencha API KEY e SECRET KEY");
  }

  data.type = "MARKET";
  data.symbol = symbol;
  data.side;
  data.quantity;
  data.timestamp = Date.now();
  data.recvWindow = 5000;

  const dataAsRecord: Record<string, string> = Object.fromEntries(
    Object.entries(data).map(([key, value]) => [key, String(value)])
  );
  const signature: string = crypto
    .createHmac("sha256", apiSecret)
    .update(`${new URLSearchParams(dataAsRecord)}`)
    .digest("hex");

  const qs: string = `?${new URLSearchParams({ ...dataAsRecord, signature })}`;

  try {
    const result = await axios({
      method: "POST",
      url: `${apiUrl}/v3/order${qs}`,
      headers: { "X-MBX-APIKEY": apiKey },
    });

    return result.data;
  } catch (err) {
    console.log(err);
  }
}

function buy(symbol: string, quantity: number): Promise<any> {
  const data: NewOrderData = { symbol, side: "BUY", quantity };
  return newOrder(data);
}

function sell(symbol: string, quantity: number): Promise<any> {
  const data: NewOrderData = { symbol, side: "SELL", quantity };
  return newOrder(data);
}

export { buy, sell };
