import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { join } from "path";
import cors from "cors";
import dotenv from "dotenv";
import session, { Session } from "express-session";

import User, { IUser } from "./model/user.model";

import { router as loginRouter } from "./routes/login.route";
import { router as homeRouter } from "./routes/home.route";
import { router as photosRouter } from "./routes/photos.route";
import { router as albumsRouter } from "./routes/albums.route";

declare module "express-session" {
  interface Session {
    user: IUser;
  }
}

export const app = express();

dotenv.config();

// view engine setup
app.use(express.static(join(__dirname, "../", "public")));
app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());
app.use(
  session({
    secret: "ssshhhhh",
    saveUninitialized: true,
    resave: true,
  })
);

// connection
const options: mongoose.ConnectOptions = {
  dbName: process.env.DB_NAME as string,
  user: process.env.DB_USER as string,
  pass: process.env.DB_PASS as string,
};

(async () => {
  await mongoose.connect(process.env.DB_CONNECTION as string, options);
  console.log("Conectado a Mongo DB...");
})();

app.use(loginRouter);
app.use(homeRouter);
app.use(photosRouter);
app.use(albumsRouter);

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.use(function (req, res, next) {
  res.render("error/404");
});

app.listen(3000, () => {
  console.log("Servidor iniciado...");
});
