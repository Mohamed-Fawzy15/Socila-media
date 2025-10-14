import { Router } from "express";
import CS from "./comment.service";
import * as CV from "./comment.validation";
import { multerCloud, fileValidation } from "./../../middleware/multer.cloud";
import { validation } from "../../middleware/validation";
import { Authentication } from "../../middleware/Authentication";
import { TokenType } from "../../utils/interfaces";

const commentRouter = Router();

commentRouter.post(
  "/",
  Authentication(),
  multerCloud({ fileType: fileValidation.image }).array("attachments", 2),
  validation(CV.createCommentSchema),
  CS.createComment
);

export default commenRouter;
