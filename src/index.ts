import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes";
import { SYMBOL, STREAM_URL, PROFIT, BUY_QTY, ASSET, PORT } from "./Configs/config";
import { initializeWebSocket } from "./services/services";


const { startNgrok } = require("./Controllers/ngrokController");
dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());
app.use(routes);

startNgrok(PORT).then((ngrokUrl: string) => {

  initializeWebSocket(SYMBOL, STREAM_URL, ASSET, BUY_QTY, PROFIT);
 

  // Inicia o servidor Express
  app.listen(PORT, () => {
    console.log(`🚀Server is running on port ${PORT}`);
  });


}).catch((err: any)=> {
  console.error('Error starting Ngrok:', err);
});


