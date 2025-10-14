import jwt, { JwtPayload } from "jsonwebtoken";
import { TokenType } from "./interfaces";
import { UserRepository } from "../DB/repositories/user.repository";
import userModel from "../DB/model/user.model";
import { AppError } from "./classError";
import { RevokeTokenRepository } from "../DB/repositories/revokeToken.repository";
import revokeTokenModel from "../DB/model/revoke.model";

const _userModel = new UserRepository(userModel);
const _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);

export const generateToken = async ({
  payload,
  signature,
  options,
}: {
  payload: Object;
  signature: string;
  options?: jwt.SignOptions;
}): Promise<string> => {
  return jwt.sign(payload, signature, options);
};

export const verifyToken = async ({
  token,
  signature,
}: {
  token: string;
  signature: string;
}): Promise<JwtPayload> => {
  return jwt.verify(token, signature) as JwtPayload;
};

export const GetSignature = async (
  prefix: string,
  tokenType: TokenType = TokenType.access
) => {
  if (tokenType == TokenType.access) {
    if (prefix == process.env.BEARER_USER) {
      return process.env.SIGNATURE_USER_TOKEN;
    } else if (prefix == process.env.BEARER_ADMIN) {
      return process.env.SIGNATURE_ADMIN_TOKEN;
    } else {
      return null;
    }
  }

  if (tokenType == TokenType.refresh) {
    if (prefix == process.env.BEARER_USER) {
      return process.env.REFRESH_SIGNATURE_USER_TOKEN;
    } else if (prefix == process.env.BEARER_ADMIN) {
      return process.env.REFRESH_SIGNATURE_ADMIN_TOKEN;
    } else {
      return null;
    }
  }

  return null;
};

export const decodedTokenAndFetchUser = async (
  token: string,
  signature: string
) => {
  const decoded = await verifyToken({
    token,
    signature,
  });

  if (!decoded) {
    throw new AppError("invalid Token", 400);
  }

  const user = await _userModel.findOne({ email: decoded.email });
  if (!user) {
    throw new AppError("User not exist", 404);
  }
  if (!user?.confirmed) {
    throw new AppError("please confirm email first", 400);
  }

  if (await _revokeTokenModel.findOne({ tokenId: decoded?.jti })) {
    throw new AppError("token is revoked", 400);
  }

  if (user?.changeCredntials?.getTime()! > decoded?.iat! * 1000) {
    throw new AppError("Credentials changed", 401);
  }

  return { decoded, user };
};
