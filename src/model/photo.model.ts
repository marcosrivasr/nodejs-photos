import Mongoose from "mongoose";

export interface IPhoto {
  _id?: string;
  filename: string;
  userid: string;
  size: number;
  mimeType: string;
  favorite: boolean;
  createdAt?: Date;
  albums: string[];
}

export interface IMetaData extends IPhoto {
  Make?: string;
  Model?: string;
  Software?: string;
  ModifyDate?: number;
  ExposureMode?: number;
  WhiteBalance?: number;
  DigitalZoomRatio?: number;
  FocalLengthIn35mmFormat?: number;
  SceneCaptureType?: number;
  GainControl?: number;
  Contrast?: number;
  Saturation?: number;
  Sharpness?: number;
  SubjectDistanceRange?: number;
  ExposureTime?: number;
  FNumber?: number;
  ExposureProgram?: number;
  ISO?: number;
  CreateDate?: number;
  ExposureCompensation?: number;
  MaxApertureValue?: number;
  MeteringMode?: number;
  LightSource?: number;
  Flash?: number;
  FocalLength?: number;
  SubSecTime?: string;
  SubSecTimeOriginal?: string;
  SubSecTimeDigitized?: string;
  ColorSpace?: number;
  ExifImageWidth?: number;
  ExifImageHeight?: number;
  SensingMethod?: number;
}

const PhotoSchema = new Mongoose.Schema({
  id: { type: Object },
  filename: { type: String, required: true, unique: true },
  userid: { type: String, required: true },
  size: { type: Number, required: true },
  mimeType: { type: String, required: true },
  createdAt: { type: Date, required: true },
  favorite: { type: Boolean, required: true, default: false },
  albums: { type: Array, required: false, default: [] },
});

export default Mongoose.model("Photo", PhotoSchema);
