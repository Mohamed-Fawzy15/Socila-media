import { Router } from "express";
import { ChatService } from "./chat.service";
import authentication from "../../middleware/Authentication";
import { fileValidation, multerCloud } from "../../middleware/multer.cloud";
import { validation } from "../../middleware/validation";
import * as CV from "./chat.validation";

const chatRouter = Router({ mergeParams: true });
const CS = new ChatService();

chatRouter.get("/", authentication(), validation(CV.getChatSchema), CS.getChat);
chatRouter.get("/group/:groupId", authentication(), validation(CV.getGroupChatSchema), CS.getGroupChat);

chatRouter.post(
  "/group",
  authentication(),
  multerCloud({ fileTypes: fileValidation.image }).single("attachment"),
  validation(CV.createGroupChatSchema),
  CS.createGroupChat
);

export default chatRouter;
