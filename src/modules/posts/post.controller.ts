import { multerCloud, fileValidation } from "./../../middleware/multer.cloud";
import { Router } from "express";
import PS from "./post.service";
import * as PV from "./post.validation";
import { validation } from "../../middleware/validation";
import { Authentication } from "../../middleware/Authentication";
import { TokenType } from "../../utils/interfaces";

const postRouter = Router({ mergeParams: true });

postRouter.use("/:postId/comments", commentRouter);

postRouter.post(
  "/",
  Authentication(),
  multerCloud({ fileType: fileValidation.image }).array("attachments", 2),
  validation(PV.createPostSchema),
  PS.createPost
);

postRouter.patch(
  "/:postId",
  Authentication(),
  validation(PV.createPostSchema),
  PS.likePost
);

postRouter.patch(
  "/update/:postId",
  Authentication(),
  multerCloud({ fileType: fileValidation.image }).array("attachments", 2),
  validation(PV.updatePostSchema),
  PS.likePost
);

export default postRouter;
