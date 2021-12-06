import Mongoose from "mongoose";

export interface IPhoto {
  _id?: string;
  filename: string;
  userid: string;
  size: number;
  mimeType: string;
}

const PhotoSchema = new Mongoose.Schema({
  id: { type: Object },
  filename: { type: String, required: true, unique: true },
  userid: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
});

export default Mongoose.model("Photo", PhotoSchema);
