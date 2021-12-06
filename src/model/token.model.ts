import mongoose from "mongoose";

const tokenSchema = new mongoose.Schema({
  token: { type: String },
});

export default mongoose.model("Token", tokenSchema);
