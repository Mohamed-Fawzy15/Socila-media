import z from "zod";
import { generalRules } from "./../../utils/generalRules";

export const createCommentSchema = {
  params: z.strictObject({
    postId: generalRules.id
  })
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
