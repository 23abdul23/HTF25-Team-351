import mongoose from "mongoose";

const fileSchema = new mongoose.Schema(
  {
    originalName: { type: String, required: true },
    blobName: { type: String, required: true },
    contentType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const capsuleSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    userId: { type: String, index: true },
    createdBy: { type: String, required: true, index: true },
    recipients: [{ type: String, index: true }],
    visibility: {
      type: String,
      enum: ["private", "shared", "public"],
      default: "private",
    },
    files: [fileSchema],
    
    lockDate: { type: Date, index: true },
    unlockDate: { type: Date, required: true, index: true },
    
    
    communityCapsule: { type: Boolean, default: false },
    sharedWith: [{ type: String, index: true }],
    sharedCapsuleId : {type : String},
    visibility: { type: String, enum: ["private", "shared", "public"], default: "private" },
  },
  {
    timestamps: true,
  },
);

// Compound index for efficient access queries
capsuleSchema.index({ createdBy: 1, unlockDate: 1 });
capsuleSchema.index({ recipients: 1, unlockDate: 1 });

const Capsule = mongoose.model("Capsule", capsuleSchema);

export default Capsule;
