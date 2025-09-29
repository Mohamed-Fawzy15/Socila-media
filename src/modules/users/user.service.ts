import { generateToken } from "./../../utils/token";
import { NextFunction, Request, Response } from "express";
import {
  signUpSchemaType,
  confirmEmailSchemaType,
  loginSchemaType,
  RoleType,
  FlagType,
  logoutSchemaType,
} from "../../utils/interfaces";
import userModel from "../../DB/model/user.model";
import revokeTokenModel from "../../DB/model/revoke.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import { Compare, Hash } from "../../utils/hash";
import { eventEmitter } from "../../utils/event";
import { generateOTP } from "../../service/sendEmail";
import { generateToken } from "../../utils/token";
import { uuidv4 } from "zod";
import { RevokeTokenRepository } from "../../DB/repositories/revokeToken.repository";

class UserService {
  // private _userModel: Model<IUser> = userModel;
  private _userModel = new UserRepository(userModel);
  private _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);

  signup = async (req: Request, res: Response, next: NextFunction) => {
    const {
      userName,
      email,
      password,
      cPassword,
      age,
      address,
      phone,
      gender,
    }: signUpSchemaType = req.body;

    if (await this._userModel.findOne({ email })) {
      throw new AppError("email is already exist", 403);
    }

    const hash = await Hash(password);
    const otp = await generateOTP();
    const hashOTP = await Hash(String(otp));

    eventEmitter.emit("confirmEmail", { email, otp });

    const user = await this._userModel.createOneUser({
      userName,
      otp: hashOTP,
      email,
      password: hash,
      age,
      address,
      phone,
      gender,
    });
    return res.status(201).json({ message: "created", user });
  };

  confirmEmail = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp }: confirmEmailSchemaType = req.body;

    const user = await this._userModel.findOne({
      email,
      confirmed: { $exists: false },
    });

    if (!user) {
      throw new AppError("email is not found or already confirmed", 404);
    }

    if (!(await Compare(otp, user?.otp!))) {
      throw new AppError("invalid otp", 400);
    }
    await this._userModel.updateOne(
      { email: user?.email },
      { confirmed: true, $unset: { otp: "" } }
    );

    return res.status(200).json({ message: "confirmed" });
  };

  login = async (req: Request, res: Response, next: NextFunction) => {
    const { email, password }: loginSchemaType = req.body;

    const user = await this._userModel.findOne({ email, confirmed: true });

    if (!user) {
      throw new AppError("email is not found or not confirmed yet", 404);
    }

    if (!(await Compare(password, user?.password!))) {
      throw new AppError("invalid password", 400);
    }

    const jwtid = uuidv4();

    const accessToken = await generateToken({
      payload: { id: user._id, email: user.email },
      signature:
        user?.role == RoleType.user
          ? process.env.SIGNATURE_USER_TOKEN!
          : process.env.SIGNATURE_ADMIN_TOKEN!,
      options: {
        expiresIn: "2h",
        jwtid,
      },
    });
    const refreshToken = await generateToken({
      payload: { id: user._id, email: user.email },
      signature:
        user?.role == RoleType.user
          ? process.env.REFRESH_SIGNATURE_USER_TOKEN!
          : process.env.REFRESH_SIGNATURE_ADMIN_TOKEN!,
      options: {
        expiresIn: "1y",
        jwtid,
      },
    });

    return res
      .status(200)
      .json({ message: "success", accessToken, refreshToken });
  };

  getProfile = async (req: Request, res: Response, next: NextFunction) => {
    return res.status(200).json({ message: "success", user: req.user });
  };

  logout = async (req: Request, res: Response, next: NextFunction) => {
    const { flag }: logoutSchemaType = req.body;
    if (flag === FlagType.all) {
      await this._userModel.updateOne(
        { _id: req.user?._id },
        { changeCredntials: new Date() }
      );
      return res
        .status(200)
        .json({ message: "success logout from all devices" });
    }

    await this._revokeTokenModel.create({
      tokenId: req.decoded?.jti!,
      userId: req.user?._id!,
      expiresAt: new Date(req.decoded?.exp! * 1000),
    });

    return res.status(200).json({ message: "success logout" });
  };

  refreshToken = async (req: Request, res: Response, next: NextFunction) => {
    const jwtid = uuidv4();

    const jwtid = uuidv4();

    const accessToken = await generateToken({
      payload: { id: req?.user._id, email: req?.user.email },
      signature:
        req?.user?.role == RoleType.user
          ? process.env.SIGNATURE_USER_TOKEN!
          : process.env.SIGNATURE_ADMIN_TOKEN!,
      options: {
        expiresIn: "2h",
        jwtid,
      },
    });
    const refreshToken = await generateToken({
      payload: { id: req?.user._id, email: req?.user.email },
      signature:
        req?.user?.role == RoleType.user
          ? process.env.REFRESH_SIGNATURE_USER_TOKEN!
          : process.env.REFRESH_SIGNATURE_ADMIN_TOKEN!,
      options: {
        expiresIn: "1y",
        jwtid,
      },
    });

    await this._revokeTokenModel.create({
      tokenId: req.decoded?.jti!,
      userId: req.user?._id!,
      expiresAt: new Date(req.decoded?.exp! * 1000),
    });


    return res.status(200).json({ message: "success refresh token", accessToken, refreshToken });
  };
}

export default new UserService();
