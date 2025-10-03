import mongoose, { Schema, Types } from "mongoose";
import {
  AllowCommentEnum,
  AvailabilityEnum,
  IPost,
} from "../../utils/interfaces";
import { Hash } from "../../utils/hash";
import { eventEmitter } from "../../utils/event";
import { generateOTP } from "../../service/sendEmail";
import { HydratedDocument } from "mongoose";

const postSchema = new mongoose.Schema<IPost>(
  {
    content: {
      type: String,
      minLength: 5,
      maxLength: 10000,
      required: function () {
        return this.attachments?.length === 0;
      },
    },
    attachments: [String],
    assetFolderId: String,
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    tags: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    likes: [
      {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
    ],
    allowComment: {
      type: String,
      enum: AllowCommentEnum,
      default: AllowCommentEnum.allow,
    },
    availability: {
      type: String,
      enum: AvailabilityEnum,
      default: AvailabilityEnum.public,
    },
    deletedAt: { type: Date },
    deleteBy: { type: Schema.Types.ObjectId, ref: "User" },
    restoredAt: { type: Date },
    restoredBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
    strictQuery: true,
  }
);

postSchema.pre(["findOne", "find"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid == false) {
    this.setQuery({ ...rest, deletedAt: { $exists: true } });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
});

const postModel =
  mongoose.models.Post || mongoose.model<IPost>("Post", postSchema);

export default postModel;
