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

    const signature = await GetSignature(tokenType, prefix);
    if (!signature) {
      throw new AppError("invalid signature", 400);
    }

    const decoded = await decodedTokenAndFetchUser(token, signature);
    if (!decoded) {
      throw new AppError("Invalid token decode", 400);
    }

    req.user = decoded?.user;
    req.decoded = decoded?.decoded;

    return next();
  };
};

export default authentication;
