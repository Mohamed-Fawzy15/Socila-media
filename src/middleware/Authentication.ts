import { decodedTokenAndFetchUser, GetSignature } from "./../utils/token";
import { NextFunction, Request, Response } from "express";
import { AppError } from "../utils/classError";
import { TokenType } from "../utils/interfaces";

export const authentication = (tokenType: TokenType = TokenType.access) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    const { authorization } = req.headers;

    const [prefix, token] = authorization?.split(" ") || [];
    if (!prefix || !token) {
      throw new AppError("token not found", 404);
    }

    const signature = await GetSignature(prefix, tokenType);
    if (!signature) {
      throw new AppError("invalid signature", 400);
    }

    const { user, decoded } = await decodedTokenAndFetchUser(token, signature);

    req.user = user;
    req.decoded = decoded;

    return next();
  };
};

export default authentication;
