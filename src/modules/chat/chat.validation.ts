import z from "zod";
import { generalRules } from "./../../utils/generalRules";

export const getChatSchema = {
  params: z.strictObject({
    userId: generalRules.id,
  }),
  query: z.strictObject({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 5)),
  }),
};

export const getGroupChatSchema = {
  params: z.strictObject({
    groupId: generalRules.id,
  }),
  query: z.strictObject({
    page: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 1)),
    limit: z
      .string()
      .optional()
      .transform((val) => (val ? parseInt(val) : 5)),
  }),
};

export const createGroupChatSchema = {
  body: z.strictObject({
    group: z.string().min(2).max(50).trim(),
    participants: z
      .array(generalRules.id)
      .min(2)
      .max(50)
      .refine(
        (value) => {
          return new Set(value).size === value?.length;
        },
        { message: "Duplicate participants" }
      ),
    groupImage: z.string().optional(),
  }),
};

export const sendMessageSchema = {
  body: z.strictObject({
    content: z.string().min(1).max(1000).trim(),
    sendTo: generalRules.id,
  }),
};

export const sendGroupMessageSchema = {
  body: z.strictObject({
    content: z.string().min(1).max(1000).trim(),
    groupId: generalRules.id,
  }),
};

export const joinRoomSchema = {
  body: z.strictObject({
    roomId: z.string().min(1).max(100).trim(),
  }),
};
