import dotenv from "dotenv";
import express from "express";
import cors from "cors";
import routes from "./routes";
import prisma from "./database/prismaCliente";
import { ERRORS } from "./constants/errors";
import { SUCCESS } from "./constants/success";
import { Request, Response } from "express";
import { SYMBOL, STREAM_URL, ASSET, PORT, SYM } from "./Configs/config";
import { WebSocketInitializer } from "./services/monitorService";
import { startNgrok } from "./Controllers/ngrokController";
dotenv.config();

async function main() {
  const app = express();
  app.use(cors());
  app.use(express.json());
  app.use(routes);

  // startNgrok(PORT)
  //   .then((ngrokUrl: string) => {
      const wsInitializer = new WebSocketInitializer (SYMBOL, STREAM_URL, ASSET, SYM);

      // Inicia o servidor Express
      app.listen(PORT, async () => {
        console.log(SUCCESS.APP.SERVEROK);
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
    // })
    // .catch((err: any) => {
    //   console.error("Error starting Ngrok:", err);
    // });
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
