import axios from "axios";
import crypto from "crypto";
import dotenv from "dotenv";
dotenv.config();

interface NewBalanceData {
  recvWindow?: number;
  timestamp?: number;
  asset?: string;
  free?: string;
  locked?: string;
}

const apiKey = process.env.API_KEY!;
const apiSecret = process.env.SECRET_KEY!;
const apiUrl = process.env.API_URL!;
const symbol = process.env.SYMBOL!;
const asset = process.env.ASSET!;

async function newBalance(data: NewBalanceData) {
  if (!apiKey || !apiSecret) {
    throw new Error("Preencha sua API KEY e SECRET KEY");
  }

  data.timestamp = Date.now();
  data.recvWindow = 5000; // máximo permitido, default 5000

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
      method: "GET",
      url: `${apiUrl}/v3/account${qs}`,
      headers: { "X-MBX-APIKEY": apiKey },
    });

    return result.data.balances;
  } catch (err) {
    console.log(err);
  }
}

function getBalance(): Promise<any> {
  const data: NewBalanceData = {};
  return newBalance(data);
}

export { getBalance };
