import { AppError } from "../utils/classError";
import { ZodType } from "./../../node_modules/zod/v4/classic/schemas.d";
import { NextFunction, Request, Response } from "express";

type ReqType = keyof Request;
type SchemaType = Partial<Record<ReqType, ZodType>>;

export const validation = (schema: SchemaType) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const validationErrors = [];
    for (const key of Object.keys(schema) as ReqType[]) {
      if (!schema[key]) continue;

      const result = schema[key]?.safeParse(req[key]);
      if (!result.success) {
        validationErrors.push(result.error);
      }
    }

    if (validationErrors.length) {
      throw new AppError(
        JSON.parse(validationErrors as unknown as string),
        400
      );
    }

    next();
  };
};
