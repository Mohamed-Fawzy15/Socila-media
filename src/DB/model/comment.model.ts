import mongoose, { Schema, Types } from "mongoose";
import { IComment } from "../../utils/interfaces";

const commentSchema = new mongoose.Schema<IComment>(
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
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    postId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Post",
      required: true,
    },

    deletedAt: { type: Date },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
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

commentSchema.pre(["findOne", "find"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid == false) {
    this.setQuery({ ...rest, deletedAt: { $exists: true } });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
});

const commentModel =
  mongoose.models.Comment || mongoose.model<IComment>("Comment", commentSchema);

export default commentModel;
