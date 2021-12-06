import dotenv from "dotenv";
import Mongoose from "mongoose";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import Token from "./token.model";

export interface IUser {
  _id?: string;
  username: string;
  password: string;
  name: string;
}

dotenv.config();
const { ACCESS_TOKEN_SECRET, REFRESH_TOKEN_SECRET } = process.env;

const UserSchema = new Mongoose.Schema({
  id: { type: Object },
  username: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  name: { type: String },
});

UserSchema.pre("save", function (next) {
  if (this.isModified("password") || this.isNew) {
    const document = this;

    bcrypt.hash(document.password, 10, (err, hash) => {
      if (err) {
        next(err);
      } else {
        document.password = hash;
        next();
      }
    });
  } else {
    next();
  }
});

UserSchema.methods.usernameExists = async function (username) {
  let result = await Mongoose.model("User").find({ username: username });
  return result.length > 0;
};

UserSchema.methods.isCorrectPassword = async function (password, hash) {
  console.log(password, hash);
  const same = await bcrypt.compare(password, hash);

  return same;
};

UserSchema.methods.createAccessToken = function () {
  const { id, username } = this;
  const accessToken = jwt.sign(
    { user: { id, username } },
    ACCESS_TOKEN_SECRET as jwt.Secret,
    { expiresIn: "1d" }
  );

  return accessToken;
};

UserSchema.methods.createRefreshToken = async function (next: () => void) {
  const { id, username } = this;
  const refreshToken = jwt.sign(
    { user: { id, username } },
    REFRESH_TOKEN_SECRET as jwt.Secret,
    { expiresIn: "1d" }
  );

  try {
    await new Token({ token: refreshToken }).save();

    return refreshToken;
  } catch (error) {
    //next(new Error("Error creating token"));
  }

  return refreshToken;
};

export default Mongoose.model("User", UserSchema);
