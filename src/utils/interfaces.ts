import { HydratedDocument, Types } from "mongoose";
import {
  confrimEmailSchema,
  logoutSchema,
  loginSchema,
  signUpSchema,
} from "../modules/users/user.validation";
import z from "zod";
import { JwtPayload } from "jsonwebtoken";

export type signUpSchemaType = z.infer<typeof signUpSchema.body>;
export type confirmEmailSchemaType = z.infer<typeof confrimEmailSchema.body>;
export type loginSchemaType = z.infer<typeof loginSchema.body>;
export type logoutSchemaType = z.infer<typeof logoutSchema.body>;

export enum GenderType {
  male = "male",
  female = "female",
}

export enum RoleType {
  user = "user",
  admin = "admin",
}

export interface IUser {
  _id: Types.ObjectId;
  fName: string;
  lName: string;
  userName?: string;
  email: string;
  password: string;
  age: number;
  phone?: string;
  address?: string;
  confirmed?: boolean;
  gender: GenderType;
  role?: RoleType;
  createdAt: Date;
  updatedAt: Date;
  changeCredntials?: Date;
}

export enum TokenType {
  access = "access",
  refresh = "refresh",
}

export interface RequestWithUser extends Request {
  user?: HydratedDocument<IUser>;
  decoded?: JwtPayload;
}

export interface IRevokeToken {
  userId: Types.ObjectId;
  tokenId: string;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export enum FlagType {
  all = "all",
  current = "current",
}
