import z from "zod";
import { FlagType, GenderType } from "../../utils/interfaces";

export const loginSchema = {
  body: z
    .strictObject({
      email: z.email(),
      password: z
        .string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}/),
    })
    .required(),
};

export const signUpSchema = {
  body: loginSchema.body
    .extend({
      userName: z.string().min(2).max(15).trim(),
      email: z.email(),
      password: z
        .string()
        .regex(/^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}/),
      cPassword: z.string(),
      age: z.number().min(18).max(60),
      address: z.string(),
      phone: z.string(),
      gender: z.enum([GenderType.male, GenderType.female]),
    })
    .required()
    .superRefine((data, ctx) => {
      console.log({ data, ctx });
      if (data.cPassword !== data.password) {
        ctx.addIssue({
          code: "custom",
          path: ["cPasswrd"],
          message: "password not match",
        });
      }
    }),
};

export const confrimEmailSchema = {
  body: z
    .object({
      email: z.email(),
      otp: z
        .string()
        .regex(/^\d{6}$/)
        .trim(),
    })
    .required(),
};

export const logoutSchema = {
  body: z
    .object({
      flag: z.enum(FlagType),
    })
    .required(),
};
