import mongoose from "mongoose";
import {
  ActionEnum,
  AllowCommentEnum,
  AvailabilityEnum,
} from "./../../utils/interfaces";
import z from "zod";
import { generalRules } from "./../../utils/generalRules";

export const createPostSchema = {
  body: z
    .strictObject({
      content: z.string().min(5).max(10000).optional(),
      attachments: z
        .array(generalRules.file)
        .refine(
          (value) => {
            return new Set(value).size === value?.length;
          },
          { message: "Duplicate tags" }
        )
        .max(2)
        .optional(),
      assetfoldeId: z.string().optional(),
      allowComment: z
        .enum(AllowCommentEnum)
        .default(AllowCommentEnum.allow)
        .optional(),
      availability: z
        .enum(AvailabilityEnum)
        .default(AvailabilityEnum.public)
        .optional(),
      tags: z.array(generalRules.id).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data?.content && !data.attachments?.length) {
        ctx.addIssue({
          code: "custom",
          path: ["content"],
          message: "Content are empty u must enter content at least",
        });
      }
    }),
};

export const likePostSchema = {
  params: z.strictObject({
    postId: generalRules.id,
  }),
  query: z.strictObject({
    action: z.enum(ActionEnum).default(ActionEnum.like),
  }),
};

export const updatePostSchema = {
  body: z
    .strictObject({
      content: z.string().min(5).max(10000).optional(),
      attachments: z
        .array(generalRules.file)
        .refine(
          (value) => {
            return new Set(value).size === value?.length;
          },
          { message: "Duplicate tags" }
        )
        .max(2)
        .optional(),
      assetfoldeId: z.string().optional(),
      allowComment: z
        .enum(AllowCommentEnum)
        .default(AllowCommentEnum.allow)
        .optional(),
      availability: z
        .enum(AvailabilityEnum)
        .default(AvailabilityEnum.public)
        .optional(),
      tags: z.array(generalRules.id).optional(),
    })
    .superRefine((data, ctx) => {
      if (!Object.values(data).length) {
        ctx.addIssue({
          code: "custom",
          message: "data is empty",
        });
      }
    }),
};
