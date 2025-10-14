import mongoose, { Schema, Types } from "mongoose";
import { IFriendRequest } from "../../utils/interfaces";

const friendRequestSchema = new mongoose.Schema<IFriendRequest>(
  {
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sendTo:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },

    acceptedAt: { type: Date },
  },
  {
    timestamps: true,
    strictQuery: true,
  }
);

friendRequestSchema.pre(["findOne", "find"], function (next) {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid == false) {
    this.setQuery({ ...rest, deletedAt: { $exists: true } });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
});

const friendRequestModel =
  mongoose.models.FriendRequest || mongoose.model<IFriendRequest>("FriendRequest", friendRequestSchema);

export default friendRequestModel;
