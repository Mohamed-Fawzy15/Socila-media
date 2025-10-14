import { HydratedDocument, Types } from "mongoose";
import {
  confrimEmailSchema,
  logoutSchema,
  loginSchema,
  signUpSchema,
  loginWithGmailSchema,
  forgetPasswordSchema,
  resetPasswordSchema,
  freezeSchema,
} from "../modules/users/user.validation";
import z from "zod";
import { JwtPayload } from "jsonwebtoken";
import { Schema } from "mongoose";
import { likePostSchema } from "../modules/posts/post.validation";
import { Socket } from "socket.io";

export enum GenderType {
  male = "male",
  female = "female",
}

export enum RoleType {
  user = "user",
  admin = "admin",
  superAdmin = "superAdmin",
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
  profileImage?: string;
  tempProfileImage?: string;
  coverImage?: string;
  confirmed?: boolean;
  gender: GenderType;
  role?: RoleType;
  createdAt: Date;
  updatedAt: Date;
  changeCredntials?: Date;
  otp?: string;
  image?: string;
  provider?: ProviderType;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
  freezeAt?: Date;
  freezeBy?: Types.ObjectId;
  friends?: Types.ObjectId[];
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

export enum ProviderType {
  system = "system",
  google = "google",
}

export enum StorageEnum {
  disk = "disk",
  cloud = "cloud",
}

// user
export type signUpSchemaType = z.infer<typeof signUpSchema.body>;
export type confirmEmailSchemaType = z.infer<typeof confrimEmailSchema.body>;
export type loginSchemaType = z.infer<typeof loginSchema.body>;
export type logoutSchemaType = z.infer<typeof logoutSchema.body>;
export type forgetPasswordSchemaType = z.infer<
  typeof forgetPasswordSchema.body
>;
export type resetPasswordSchemaType = z.infer<typeof resetPasswordSchema.body>;
export type loginWithGmailSchemaType = z.infer<
  typeof loginWithGmailSchema.body
>;
export type freezeSchemaType = z.infer<typeof freezeSchema.params>;

// posts

export enum AllowCommentEnum {
  allow = "allow",
  deny = "deny",
}

export enum AvailabilityEnum {
  public = "public",
  private = "private",
  friends = "friends",
}

export enum ActionEnum {
  like = "like",
  unlike = "unlike",
}

export interface IPost {
  content?: string;
  attachments?: string[];
  assetFolderId?: string;
  createdBy: Schema.Types.ObjectId;
  tags: Schema.Types.ObjectId[];
  likes: Schema.Types.ObjectId[];
  allowComment: AllowCommentEnum;
  availability: AvailabilityEnum;
  deletedAt?: Date;
  deleteBy?: Schema.Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Schema.Types.ObjectId;
}

export type likePostDto = z.infer<typeof likePostSchema.params>;
export type likePostQueryDto = z.infer<typeof likePostSchema.params>;

// comment

export interface IComment {
  content?: string;
  attachments?: string[];
  assetFolderId?: string;
  likes?: Types.ObjectId[];
  tags?: Types.ObjectId[];
  createdBy: Types.ObjectId;
  postId: Types.ObjectId;
  deletedAt?: Date;
  deletedBy?: Types.ObjectId;
  restoredAt?: Date;
  restoredBy?: Types.ObjectId;
}

export interface IFriendRequest {
  createdBy: Types.ObjectId;
  sendTo: Types.ObjectId;
  acceptedAt?: Date;
}

export interface SocketWithUser extends Socket {
  user?: Partial<HydratedDocument<IUser>>;
  decoded?: JwtPayload;
}

export interface IMessage {
  content: string;
  createdBy: Types.ObjectId;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface IChat {
  // one to one
  participants: Types.ObjectId[];
  createdBy: Types.ObjectId;
  messages: IMessage[];

  // group chat
  group?: string;
  groupImage?: string;
  roomId: string;

  createdAt: Date;
  updatedAt: Date;
}
