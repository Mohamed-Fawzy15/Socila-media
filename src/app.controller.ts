import { resolve } from "path";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { AppError } from "./utils/classError";
import userRouter from "./modules/users/user.controller";
import connectionDB from "./DB/connectionDB";

config({ path: resolve("./config/.env") });

const app: express.Application = express();
const port: string | number = process.env.PORT || 5000;
const limiter = rateLimit({
  windowMs: 5 * 60 * 1000,
  limit: 10,
  message: {
    error: "game over..........",
  },
  statusCode: 429,
  legacyHeaders: false,
});

const bootstarp = async () => {
  app.use(express.json());
  app.use(cors());
  app.use(helmet());
  app.use(limiter);

  app.get("/", (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "welcome to my social media app" });
  });

  app.use("/users", userRouter);

  await connectionDB();

  app.use("{/*demo}", (req: Request, res: Response, next: NextFunction) => {
    throw new AppError(`invalid url ${req.originalUrl}`, 404);
  });

  app.use(
    (error: AppError, req: Request, res: Response, next: NextFunction) => {
      return res
        .status((error.statusCode as unknown as number) || 500)
        .json({ message: error.message, stack: error.stack });
    }
  );

  app.listen(port, () => {
    console.log(`server is running on port ${port}`);
  });
};

export default bootstarp;
