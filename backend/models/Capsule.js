import mongoose from "mongoose";

const capsuleSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  files: [
    {
      originalName: { type: String, required: true },
      blobName: { type: String, required: true },
      contentType: { type: String, required: true },
      size: { type: Number, required: true },
    },
  ],
  unlockDate: { type: Date, required: true },
});

const Capsule = mongoose.model("Capsule", capsuleSchema);

export default Capsule;
