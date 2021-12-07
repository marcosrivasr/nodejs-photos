import Mongoose from "mongoose";

export interface IAlbum {
  _id?: string;
  name: string;
  userid: string;
  isPrivate: boolean;
  createdAt?: Date;
}

const AlbumSchema = new Mongoose.Schema({
  id: { type: Object },
  name: { type: String, required: true, unique: true },
  userid: { type: String, required: true },
  isprivate: { type: Boolean, required: true, default: true },
  createdAt: { type: Date, default: Date.now },
});

export default Mongoose.model("Album", AlbumSchema);
