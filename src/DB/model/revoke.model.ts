import mongoose, { Types } from "mongoose";
import { IRevokeToken } from "../../utils/interfaces";

const revokeTokenSchema = new mongoose.Schema<IRevokeToken>(
  {
    userId: Types.ObjectId,
    tokenId: String,
    expiresAt: Date,
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

const revokeTokenModel =
  mongoose.models.RevokeToken ||
  mongoose.model<IRevokeToken>("RevokeToken", revokeTokenSchema);

export default revokeTokenModel;
