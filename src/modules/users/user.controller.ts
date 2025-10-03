import { multerCloud, fileValidation } from "./../../middleware/multer.cloud";
import { Router } from "express";
import US from "./user.service";
import { validation } from "../../middleware/validation";
import { Authentication } from "../../middleware/Authentication";
import {
  signUpSchema,
  confrimEmailSchema,
  logoutSchema,
  loginWithGmailSchema,
  forgetPasswordSchema,
  loginSchema,
  freezeSchema,
} from "./user.validation";
import { TokenType } from "../../utils/interfaces";

const userRouter = Router();

userRouter.post("/signup", validation(signUpSchema), US.signup);
userRouter.patch(
  "/confirmEmail",
  validation(confirmEmailSchema),
  US.confirmEmail
);
userRouter.post("/login", validation(loginSchema), US.login);
userRouter.get("/profile", Authentication(), US.getProfile);
userRouter.post(
  "/logout",
  Authentication(),
  validation(logoutSchema),
  US.logout
);
userRouter.get(
  "/refreshToken",
  Authentication(TokenType.refresh),
  US.refreshToken
);
userRouter.post(
  "/loginWithGoogle",
  validation(loginWithGmailSchema),
  US.loginWithGoogle
);
userRouter.patch(
  "/forgetPassword",
  validation(forgetPasswordSchema),
  US.forgetPassword
);
userRouter.patch(
  "/resetPassword",
  validation(resetPasswordSchema),
  US.resetPassword
);
userRouter.post(
  "/upload",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).single("file"),
  US.uploadImage
);
userRouter.post(
  "/uploadLargeFile",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).single("file"),
  US.uploadLarge
);
userRouter.post(
  "/uploadMulti",
  Authentication(),
  multerCloud({ fileTypes: fileValidation.image }).array("files"),
  US.uploadMultipleFiles
);
userRouter.post("/uploadFilePresignedUrl", Authentication(), US.uploadFile);
userRouter.post("/uploadProfileImage", Authentication(), US.uploadProfileImage);
userRouter.delete(
  "/freeze{/:userId}",
  Authentication(TokenType.access),
  validation(freezeSchema),
  US.freezeAccount
);
userRouter.delete(
  "/unfreeze/:userId",
  Authentication(TokenType.access),
  validation(freezeSchema),
  US.unFreezeAccount
);

export default userRouter;
