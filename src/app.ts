import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { join } from "path";
import { promises as fs } from "fs";
import dotenv from "dotenv";
import multer from "multer";
import session, { Session } from "express-session";
// @ts-ignore: Unreachable code error
import ExifParser from "exif-parser";

import User, { IUser } from "./model/user.model";
import Photo, { IMetaData, IPhoto } from "./model/photo.model";

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./public/images");
  },
  filename: function (req, file, cb) {
    const ext = file.originalname.split(".");
    const uniqueSuffix = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + "." + ext[ext.length - 1]);
  },
});

const upload = multer({ storage: storage });

declare module "express-session" {
  interface Session {
    user: IUser;
  }
}

export const app = express();

dotenv.config();

app.use(
  session({
    secret: "ssshhhhh",
    saveUninitialized: true,
    resave: true,
  })
);
// view engine setup
console.log(join(__dirname, "../", "public"));
app.use(express.static(join(__dirname, "../", "public")));
app.set("views", join(__dirname, "views"));
app.set("view engine", "ejs");

console.log(`sdsd`);

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

//app.use(cookieParser());

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

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.get("/login", (req: Request, res: Response) => {
  res.render("login/index");
});
app.get("/signup", (req: Request, res: Response) => {
  res.render("login/signup");
});

app.get("/home", async (req: Request, res: Response) => {
  try {
    const photos = await Photo.find({ userid: req.session.user._id! });
    console.log(photos);

    const finalPhotos = Array<IMetaData>();

    photos.forEach(async (photo) => {
      const imgbuffer = await fs.readFile(
        join(__dirname, "../", "public/images", photo.filename)
      );
      const parser = ExifParser.create(imgbuffer);
      parser.enableBinaryFields(true);
      parser.enableTagNames(true);
      parser.enableImageSize(true);
      parser.enableReturnTags(true);
      const img = parser.parse();
      //console.log(img.tags);
      console.log(photo);
      //console.log({ ...photo, ...img.tags });

      finalPhotos.push({ ...photo.doc, ...img.tags });
    });

    res.render("home/index", { user: req.session.user, photos: finalPhotos });
  } catch (error) {
    res.render("home/index", { user: req.session.user });
  }
});

app.post(
  "/upload",
  upload.array("photos", 10),
  (req: Request, res: Response) => {
    const files = req.files! as Express.Multer.File[];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const image: IPhoto = {
        filename: file.filename,
        mimeType: file.mimetype,
        userid: req.session.user._id!,
        size: file.size,
      };
      const photo = new Photo(image);
      photo.save();
      res.redirect("/home");
    }
  }
);

app.post("/auth", async (req: Request, res: Response, next: NextFunction) => {
  const { username, password } = req.body;

  try {
    let user = new User();
    const userExists = await user.usernameExists(username);

    if (userExists) {
      user = await User.findOne({ username: username });

      const passwordCorrect = await user.isCorrectPassword(
        password,
        user.password
      );

      if (passwordCorrect) {
        //let accessToken = await user.createAccessToken();
        //let refreshToken = await user.createRefreshToken();

        req.session.user = user;

        console.log(req.session.user);

        /* return res.json({
          accessToken,
          refreshToken,
        }); */
        res.redirect("/home");
      } else {
        return next(new Error("username and/or password incorrect"));
      }
    } else {
      return next(new Error("user does not exist"));
    }
  } catch (err) {
    console.log(err);
  }
});

app.post(
  "/register",
  async (req: Request, res: Response, next: NextFunction) => {
    const { username, password, name } = req.body;

    if (!username || !password || !name) {
      console.log("no hay username o password");
      //next();
    } else {
      const userObject: IUser = { username, password, name };
      const user = new User(userObject);

      const exists = await user.usernameExists(username);

      if (exists) {
        res.redirect("/signup");
      } else {
        await user.save();

        console.log("User added");

        res.redirect("/login");
      }
    }
  }
);

app.listen(3000, () => {
  console.log("Servidor iniciado...");
});
