import mongoose, { Types } from "mongoose";
import {
  GenderType,
  IUser,
  ProviderType,
  RoleType,
} from "../../utils/interfaces";
import { Hash } from "../../utils/hash";
import { eventEmitter } from "../../utils/event";
import { generateOTP } from "../../service/sendEmail";
import { HydratedDocument } from "mongoose";

const userSchema = new mongoose.Schema<IUser>(
  {
    fName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 5,
      trim: true,
    },
    lName: {
      type: String,
      required: true,
      minLength: 2,
      maxLength: 5,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    password: {
      type: String,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    age: {
      type: Number,
      min: 18,
      max: 60,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    phone: {
      type: String,
    },
    address: {
      type: String,
    },
    confirmed: {
      type: Boolean,
    },
    gender: {
      type: String,
      enum: GenderType,
      required: function () {
        return this.provider === ProviderType.google ? false : true;
      },
    },
    role: {
      type: String,
      enum: RoleType,
      default: RoleType.user,
    },
    changeCredntials: {
      type: Date,
    },
    provider: {
      type: String,
      enum: ProviderType,
      default: ProviderType.system,
    },
    deletedAt: {
      type: Date,
    },
    deletedBy:{
      type: Types.ObjectId, ref:"User"
    },
    restoredAt: {
      type: Date,
    },
    restoredBy:{
      type: Types.ObjectId, ref:"User"
    },
    profileImage: {
      type: String,
    },
    tempProfileImage: {
      type: String,
    },
    friends: [{
      type: Types.ObjectId,
      ref: "User"
    }]
  },
  {
    timestamps: true,
    toObject: { virtuals: true },
    toJSON: { virtuals: true },
  }
);

userSchema
  .virtual("userName")
  .set(function (value) {
    const [fName, lName] = value.split(" ");
    this.set({ fName, lName });
  })
  .get(function () {
    return this.fName + " " + this.lName;
  });

userSchema.pre(
  "save",
  async function (this: HydratedDocument<IUser> & { NEW: boolean }, next) {
    this.NEW = this.isNew;
    if (!this.isModified("password")) {
      this.password = await Hash(this.password);
    }
  }
);

userSchema.post("save", async function () {
  const that = this as HydratedDocument<IUser> & { NEW: boolean };
  if (that.NEW == true) {
    const otp = await generateOTP();
    eventEmitter.emit("confirmEmail", { email: this.email, otp });
  }
});
userSchema.pre(["findOne", "updateOne"], async function () {
  const query = this.getQuery();
  const { paranoid, ...rest } = query;
  if (paranoid == false) {
    this.setQuery({ ...rest });
  } else {
    this.setQuery({ ...rest, deletedAt: { $exists: false } });
  }
});

const userModel =
  mongoose.models.User || mongoose.model<IUser>("User", userSchema);

export default userModel;
