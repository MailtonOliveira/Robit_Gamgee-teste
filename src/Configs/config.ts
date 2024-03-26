import { config } from 'dotenv';
config();

const SYMBOL: string = process.env.SYMBOL || "";
const STREAM_URL: string = process.env.STREAM_URL || "";
const PROFIT: number = parseFloat(process.env.PROFIT ?? "");
const BUY_QTY: number = parseFloat(process.env.BUY_QTY ?? "0");
const ASSET = process.env.ASSET!;
const SYM = process.env.SYM!;
const PORT = parseInt(process.env.PORT || "");

export { SYMBOL, STREAM_URL, PROFIT, BUY_QTY, ASSET, SYM, PORT };