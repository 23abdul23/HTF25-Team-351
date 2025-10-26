import mongoose from "mongoose";

const { Schema } = mongoose;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: { type: String },
    name: { type: String },
    googleId: { type: String, index: true },
    avatarUrl: { type: String },
  },
  { timestamps: true },
);

const User = mongoose.models.User || mongoose.model("User", UserSchema);


export default User;