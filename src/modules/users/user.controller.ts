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
userRouter.get(
  "/loginWithGoogle",
  validation(loginWithGmailSchema),
  US.loginWithGoogle
);
userRouter.get(
  "/forgetPassword",
  validation(forgetPasswordSchema),
  US.forgetPassword
);
userRouter.get(
  "/resetPassword",
  validation(resetPasswordSchema),
  US.resetPassword
);

export default userRouter;
