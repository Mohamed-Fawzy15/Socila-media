import { EventEmitter } from "events";
import { sendEmail } from "../service/sendEmail";
import { emailTemplate } from "../service/email.template";
import { getFile, deleteFile } from "./utils/s3.config";
import userModel from "../../DB/model/user.model";
import { UserRepository } from "../../DB/repositories/user.repository";

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
  const { email, otp } = data;

  await sendEmail({
    to: email,
    subject: "confirm Email",
    html: emailTemplate(otp as unknown as string, "Email Confirmation"),
  });
});

eventEmitter.on("ForgetPassword", async (data) => {
  const { email, otp } = data;

  await sendEmail({
    to: email,
    subject: "Forget Password",
    html: emailTemplate(otp as unknown as string, "Forget Password"),
  });
});

eventEmitter.on("UploadProfileImage", async (data) => {
  const { userId, oldKey, Key, expiersIn } = data;
  const _userModel = new UserRepository(userModel);

  setTimeout(async () => {
    try {
      await getFile({ Key });
      await _userModel.findOneAndUpdate({ _id: userId,},{$unset: { tempProfileImage: "" },});
      if(oldKey){
        await deleteFile({Key: oldKey});
      }
    } catch (error: any) {
      console.log(error);
      if (error?.Code == "NoSuchKey") {
        if (!oldKey) {
          await _userModel.findOneAndUpdate({ _id: userId,},{$unset: { profileImage: "" },});
        }else{
          await _userModel.findOneAndUpdate({ _id: userId,},{$set: { profileImage: oldKey }, $unset:{tempProfileImage: ""}});
        }
      }
    }
  }, expiersIn * 1000);
});
