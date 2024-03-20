import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes";
import prisma from "./database/prismaCliente";
import { ERRORS } from "./constants/errors";
import { SUCCESS } from "./constants/success";
import { Request, Response } from "express";
import { SYMBOL, STREAM_URL, ASSET, PORT } from "./Configs/config";
import { initializeWebSocket } from "./services/monitorService";

const { startNgrok } = require("./Controllers/ngrokController");
dotenv.config();

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(routes);

  startNgrok(PORT)
    .then((ngrokUrl: string) => {
      initializeWebSocket(SYMBOL, STREAM_URL, ASSET);

      // Inicia o servidor Express
      app.listen(PORT, async () => {
        console.log(`🚀Server is running on port ${PORT}`);
        try {
          await prisma.$connect();
          console.log(SUCCESS.DATABASE.HASCONECTIONOK);

          app.get("/", (req: Request, res: Response) => {
            res.json({ message: SUCCESS.APP.SERVERWORKER });
          });

          app.get("/healthz", (req: Request, res: Response) => {
            res.status(200).json({ message: SUCCESS.APP.SERVERWORKER });
          });
        } catch (error) {
          console.log(ERRORS.DATABASE.SEQERROR);
        }
      });
    })
    .catch((err: any) => {
      console.error("Error starting Ngrok:", err);
    });
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
