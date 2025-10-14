import mongoose, { model, Schema, models } from "mongoose";
import { IChat, IMessage } from "../../utils/interfaces";

const messageSchema = new Schema<IMessage>(
  {
    content: { type: String, required: true },
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

const chatSchema = new Schema<IChat>(
  {
    participants: [
      { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    ],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messages: [messageSchema],
    group: { type: String },
    groupImage: { type: String },
    roomId: { type: String },
  },
  {
    timestamps: true,
  }
);

const chatModel = models.Chat || model<IChat>("Chat", chatSchema);

export default chatModel;
