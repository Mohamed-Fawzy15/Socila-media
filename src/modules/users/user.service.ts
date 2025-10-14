import { generateToken } from "./../../utils/token";
import { NextFunction, Request, Response } from "express";
import {
  signUpSchemaType,
  confirmEmailSchemaType,
  loginSchemaType,
  RoleType,
  FlagType,
  logoutSchemaType,
  ProviderType,
  loginWithGmailSchemaType,
  forgetPasswordSchemaType,
  resetPasswordSchemaType,
  StorageEnum,
  freezeSchemaType,
} from "../../utils/interfaces";
import userModel from "../../DB/model/user.model";
import postModel from "../../DB/model/post.model";
import friendRequestModel from "../../DB/model/friendRequest.model";
import { FriendRequestRepository } from "../../DB/repositories/friendRequest.repository";
import { PostRepository } from "../../DB/repositories/post.repository";
import revokeTokenModel from "../../DB/model/revoke.model";
import { AppError } from "../../utils/classError";
import { UserRepository } from "../../DB/repositories/user.repository";
import { Compare, Hash } from "../../utils/hash";
import { eventEmitter } from "../../utils/event";
import { generateOTP } from "../../service/sendEmail";
import { v4 as uuidv4 } from "uuid";
import { RevokeTokenRepository } from "../../DB/repositories/revokeToken.repository";
import { OAuth2Client, TokenPayload } from "google-auth-library";
import {
  s3client,
  uploadFiles,
  uploadFile,
  uploadLarageFile,
  createUploadFilePresignedUrl,
} from "../../utils/s3.config";
import { GetObjectCommand } from "@aws-sdk/client-s3";
import { ChatRepository } from "../../DB/repositories/chat.repository";
import chatModel from "../../DB/model/chat.model";

class UserService {
  // private _userModel: Model<IUser> = userModel;
  private _userModel = new UserRepository(userModel);
  private _postModel = new PostRepository(postModel);
  private _revokeTokenModel = new RevokeTokenRepository(revokeTokenModel);
  private _friendRequestModel = new FriendRequestRepository(friendRequestModel);
  private _chatModel = new ChatRepository(chatModel);

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

    const user = await this._userModel.findOne({
      email,
      confirmed: { $exists: true },
      provider: ProviderType.system,
    });

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
    const user = await this._userModel.findOne({_id: req.user?._id}, undefined)
    const groups = await this._chatModel.find({
      filter: {
        partiacipants: { $in: [req.user?._id] },
        group: { $exists: true },
      }
    })
    return res.status(200).json({ message: "success", user, groups });
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

    const accessToken = await generateToken({
      payload: { id: req?.user!._id, email: req?.user!.email },
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
      payload: { id: req?.user!._id, email: req?.user!.email },
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

    return res
      .status(200)
      .json({ message: "success refresh token", accessToken, refreshToken });
  };

  loginWithGmail = async (req: Request, res: Response, next: NextFunction) => {
    const { idToken }: loginWithGmailSchemaType = req.body;

    const client = new OAuth2Client();
    async function verify() {
      const ticket = await client.verifyIdToken({
        idToken,
        audience: process.env.WEB_CLIENT_ID!,
      });
      const payload = ticket.getPayload();
      return payload;
    }
    const { email, email_verified, picture, name } =
      (await verify()) as TokenPayload;

    let user = await this._userModel.findOne({ email });
    if (!user) {
      user = await this._userModel.create({
        userName: name!,
        email: email!,
        confirmed: email_verified!,
        image: picture!,
        provider: ProviderType.google,
      });
    }

    if (user?.provider !== ProviderType.google) {
      throw new Error("please login on system");
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

  forgetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email }: forgetPasswordSchemaType = req.body;

    const user = await this._userModel.findOne({
      email,
      confirmed: { $exists: true },
    });
    if (!user) {
      throw new AppError("email not found or not confirmed yet", 404);
    }

    const otp = await generateOTP();
    const hashOTP = await Hash(String(otp));

    eventEmitter.emit("ForgetPassword", { email, otp });

    await this._userModel.updateOne({ email: user?.email }, { otp: hashOTP });

    return res.status(200).json({ message: "success send otp" });
  };

  resetPassword = async (req: Request, res: Response, next: NextFunction) => {
    const { email, otp, password, cPassword }: resetPasswordSchemaType =
      req.body;

    const user = await this._userModel.findOne({
      email,
      otp: { $exists: true },
    });
    if (!user) {
      throw new AppError("email not found or not confirmed yet", 404);
    }
    if (!(await Compare(otp, user?.otp!))) {
      throw new AppError("invalid otp", 400);
    }

    const hash = await Hash(password);

    await this._userModel.updateOne(
      { email: user?.email },
      { password: hash, $unset: { otp: "" } }
    );

    return res.status(200).json({ message: "success reset password" });
  };

  uploadImage = async (req: Request, res: Response, next: NextFunction) => {
    const key = await uploadFile({
      file: req.file,
      path: `users/${req.user?._id}`,
    });
    return res.status(200).json({ message: "success", key });
  };

  uploadLarge = async (req: Request, res: Response, next: NextFunction) => {
    const key = await uploadLarageFile({
      file: req.file!,
      path: `users/${req.user?._id}`,
    });
    return res.status(200).json({ message: "success", key });
  };

  uploadMultipleFiles = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const key = await uploadFiles({
      files: req.files as Express.Multer.File[],
      path: `users/${req.user?._id}`,
    });
    return res.status(200).json({ message: "success", key });
  };

  uploadFile = async (req: Request, res: Response, next: NextFunction) => {
    const { originalname, ContentType } = req.body;
    const url = await createUploadFilePresignedUrl({
      originalname,
      ContentType,
      path: `users/${req.user?._id}`,
    });
    return res.status(200).json({ message: "success", url });
  };

  uploadProfileImage = async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    const { originalname, ContentType } = req.body;
    const { url, Key } = await createUploadFilePresignedUrl({
      originalname,
      ContentType,
      path: `users/${req.user?._id}`,
    });

    const user = await this._userModel.findOneAndUpdate(
      {
        _id: req.user?._id,
      },
      {
        profileImage: Key,
        tempProfileImage: req.user?.profileImage,
      }
    );
    if (!user) {
      throw new AppError("user not found", 404);
    }

    eventEmitter.emit("UploadProfileImage", {
      userId: req.user?._id,
      oldKey: req.user?.profileImage,
      Key,
      expiresIn: 60,
    });

    return res.status(200).json({ message: "done", url, user });
  };

  freezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId }: freezeSchemaType = req.params as freezeSchemaType;

    if (userId && req.user?.role !== RoleType.admin) {
      throw new AppError("unauthorized", 401);
    }

    const user = await this._userModel.findOneAndUpdate(
      { _id: userId || req.user?._id, deletedAt: { $exist: false } },
      {
        $set: {
          deletedAt: new Date(),
          deletedBy: req.user?._id,
          changeCredntials: new Date(),
        },
      }
    );

    if (!user) {
      throw new AppError("user not found", 404);
    }

    return res.status(200).json({ message: "freezed" });
  };

  unFreezeAccount = async (req: Request, res: Response, next: NextFunction) => {
    const { userId } = req.params;

    if (req.user?.role !== RoleType.admin) {
      throw new AppError("unauthorized", 401);
    }

    const user = await this._userModel.findOneAndUpdate(
      { _id: userId, deletedAt: { $exist: true }, deletedBy: { $ne: userId } },
      {
        $unset: { deletedAt: "", deletedBy: "" },
        restoredAt: new Date(),
        restoredBy: req.user?._id,
      }
    );

    if (!user) {
      throw new AppError("user not found", 404);
    }

    return res.status(200).json({ message: "freezed" });
  };

  dashboard = async (req: Request, res: Response, next: NextFunction) => {

    const result = await Promise.allSettled([
      this._userModel.find({ filter: {} })
      this._postModel.find({ filter: {} })
    ])

    return res.status(200).json({ message: "success", result});
  };

  updateRole = async (req: Request, res: Response, next: NextFunction) => {

    const {userId} = req.params;
    const {role: newRole} = req.body;

    const denyRoles : RoleType[] = [newRole, RoleType.superAdmin];

    if(req.user?.role == RoleType.admin){
      denyRoles.push(RoleType.admin)
      if(newRole == RoleType.superAdmin){
        denyRoles.push(RoleType.user)
        // throw new AppError("unauthorized", 403)
      }
    }

    const user = await this._userModel.findOneAndUpdate({
      _id:userId,
      role: {$nin: denyRoles}
    },
  {
    role: newRole
  }, {
    new: true
  })

  if(!user){
    throw new AppError("user Not Found", 404)
  }

    return res.status(200).json({ message: "success", user});
  };

   sendRequest = async (req: Request, res: Response, next: NextFunction) => {

   const { userId } = req.params;

    const user = await this._userModel.findOne({_id:userId})

  if(!user){
    throw new AppError("user Not Found", 404)
  }

  if(req.user?._id == userId){
    throw new AppError("you can't send a request to yourself!", 400)
  }

  const checkRequest = await this._friendRequestModel.findOne({
    createdBy: { $in: [req.user?._id, userId] },
    sendTo: {$in: [req.user?._id, userId]}
  })

  if(checkRequest){
    throw new AppError("request already send", 400)
  }

  const friendRequest = await _friendRequestModel.create({
    createdBy: req.user?._id as unknown as Types.ObjectId,
    sendTo: userId
  })



    return res.status(200).json({ message: "success", friendRequest});
  };


  acceptRequest = async (req: Request, res: Response, next: NextFunction) => {

   const { requestId } = req.params;



  const checkRequest = await this._friendRequestModel.findOneAndUpdate({
    _id: requestId,
    sendTo: req.user?._id
  },{
    acceptedAt: new Date()
  },{
    new: true
  })

  if(checkRequest){
    throw new AppError("request already send", 400)
  }


  await Promise.all([
    this._userModel.updateOne({_id:checkRequest?.createdBy}, {$push:{friends:checkRequest.sendTo}}),
    this._userModel.updateOne({_id:checkRequest?.sendTo}, {$push:{friends:checkRequest.createdBy}}),

  ])


    return res.status(200).json({ message: "friend request accepted"});
  };

}

export default new UserService();
