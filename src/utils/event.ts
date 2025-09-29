import { EventEmitter } from "events";
import { sendEmail } from "../service/sendEmail";
import { emailTemplate } from "../service/email.template";

export const eventEmitter = new EventEmitter();

eventEmitter.on("confirmEmail", async (data) => {
  const { email, otp } = data;

  await sendEmail({
    to: email,
    subject: "confirm Email",
    html: emailTemplate(otp as unknown as string, "Email Confirmation"),
  });
});
