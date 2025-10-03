import { resolve } from "path";
import { config } from "dotenv";
import express, { NextFunction, Request, Response } from "express";
import cors from "cors";
import helmet from "helmet";
import { rateLimit } from "express-rate-limit";
import { AppError } from "./utils/classError";
import userRouter from "./modules/users/user.controller";
import connectionDB from "./DB/connectionDB";
import { promisify } from "node:util";
import { pipeline } from "node:stream";
import {
  createGetFilePresignedUrl,
  deleteFile,
  deleteFiles,
  getFile,
  listFiles,
} from "./utils/s3.config";
import { ListObjectsV2CommandOutput } from "@aws-sdk/client-s3";
import postRouter from "./modules/posts/post.controller";

const writePipline = promisify(pipeline);

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

  app.get(
    "/upload/pre-signed/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { path } = req.params as unknown as { path: string[] };
      const { downloadName } = req.query as { downloadName: string };
      const Key = path.join("/");

      const url = await createGetFilePresignedUrl({
        Key,
        downloadName: downloadName || undefined,
      });
      return res.status(200).json({ message: "success", url });
    }
  );

  app.get(
    "/upload/",
    async (req: Request, res: Response, next: NextFunction) => {
      let result = await listFiles({
        path: "users",
      });
      if (!result?.Contents) {
        throw new AppError("not found", 404);
      }

      result = result?.Contents?.map(
        (item) => item.Key
      ) as unknown as ListObjectsV2CommandOutput;

      await deleteFiles({
        urls: result as unknown as string[],
        Quiet: true,
      });
      return res.status(200).json({ message: "success", result });
    }
  );

  app.get(
    "/upload/delete/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { path } = req.params as unknown as { path: string[] };
      const Key = path.join("/");

      const result = await deleteFile({
        Key,
      });

      return res.status(200).json({ message: "success", result });
    }
  );

  app.get(
    "/upload/deleteFiles/",
    async (req: Request, res: Response, next: NextFunction) => {
      const result = await deleteFiles({
        urls: ["image key1", "image key2"],
        Quiet: true,
      });

      return res.status(200).json({ message: "success", result });
    }
  );

  app.get(
    "/upload/*path",
    async (req: Request, res: Response, next: NextFunction) => {
      const { path } = req.params as unknown as { path: string[] };
      const { downloadName } = req.query as { downloadName: string };
      const Key = path.join("/");

      const result = await getFile({ Key });
      const stream = result.Body as NodeJS.ReadableStream;

      res.setHeader("Content-Type", result?.ContentType!);
      if (downloadName) {
        res.setHeader(
          "Content-Disposition",
          `attachment; filename="${
            downloadName || path.join("/").split("/").pop()
          }"`
        );
      }

      await writePipline(stream, res);
    }
  );

  app.use("/users", userRouter);
  app.use("/posts", postRouter);

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
