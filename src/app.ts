import express, { NextFunction, Request, Response } from "express";
import mongoose from "mongoose";
import { join } from "path";
import cors from "cors";
import dotenv from "dotenv";
import multer from "multer";
import session, { Session } from "express-session";
// @ts-ignore: Unreachable code error
import ExifParser from "exif-parser";

import User, { IUser } from "./model/user.model";
import Album, { IAlbum } from "./model/album.model";
import Photo, { IPhoto } from "./model/photo.model";

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
app.use(cors());

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

function middleware(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    next();
  } else {
    res.redirect("/login");
  }
}

function middlewareHome(req: Request, res: Response, next: NextFunction) {
  if (req.session.user) {
    res.redirect("/home");
  } else {
    next();
  }
}

function middlewarePrivacy(req: Request, res: Response, next: NextFunction) {
  console.log(req.route);
}

app.get("/", (req: Request, res: Response) => {
  res.render("index");
});

app.get("/login", middlewareHome, (req: Request, res: Response) => {
  res.render("login/index");
});
app.get("/signup", middlewareHome, (req: Request, res: Response) => {
  res.render("login/signup");
});

app.get("/home", middleware, async (req: Request, res: Response) => {
  try {
    const photos = await Photo.find({ userid: req.session.user._id! });
    const albums = await Album.find({ userid: req.session.user._id! });
    console.log(photos);

    res.render("home/index", {
      user: req.session.user,
      photos: photos,
      albums: albums,
    });
  } catch (error) {
    res.render("home/index", { user: req.session.user });
  }
});

app.post(
  "/upload",
  middleware,
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
        createdAt: new Date(),
        favorite: false,
        albums: [],
      };
      const photo = new Photo(image);
      photo.save();
      res.redirect("/home");
    }
  }
);

app.get(
  "/albums",
  middleware,
  async (req: Request, res: Response, next: NextFunction) => {
    const albums = await Album.find({ userid: req.session.user._id! });
    res.render("albums/index", { user: req.session.user, albums: albums });
  }
);

app.get(
  "/albums/:id",
  middleware,
  async (req: Request, res: Response, next: NextFunction) => {
    const albumid = req.params.id;

    try {
      let photos = await Photo.find({
        albums: albumid,
      });

      let album = await Album.findById(albumid);

      if (album.userid !== req.session.user._id && album.isprivate) {
        res.render("error/privacy", {});
        return;
      }

      const albums = await Album.find({ userid: req.session.user._id! });

      console.log({ albumid, photos });

      photos = (<IPhoto[]>photos).filter((photo) =>
        photo.albums.includes(albumid)
      );

      console.log("photos por id", albumid, photos);
      res.render("albums/view", {
        user: req.session.user,
        photos,
        album,
        albums,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.get(
  "/view/:id",
  middleware,
  async (req: Request, res: Response, next: NextFunction) => {
    const photoid = req.params.id as string;
    const origin = req.query.origin as string;
    try {
      const photo = await Photo.findById(photoid);
      const albums = await Album.find({ userid: req.session.user._id! });

      res.render("layout/preview", {
        user: req.session.user,
        photo,
        albums,
        origin,
      });
    } catch (error) {
      console.log(error);
    }
  }
);

app.post("/create-album", middleware, (req: Request, res: Response) => {
  const { name, isprivate }: { name: string; isprivate: string } = req.body;

  const albumObject: IAlbum = {
    name: name,
    userid: req.session.user._id!,
    isPrivate: isprivate === "on",
    createdAt: new Date(),
  };

  console.log({ albumObject });

  const album = new Album(albumObject);
  album.save();
  res.redirect("/albums");
});

app.post("/add-to-album", middleware, async (req: Request, res: Response) => {
  const { ids, albumid }: { ids: string; albumid: string } = req.body;

  const idPhotos = ids.split(",");

  const promises = [];

  for (let i = 0; i < idPhotos.length; i++) {
    promises.push(
      Photo.findByIdAndUpdate(idPhotos[i], {
        $push: { albums: albumid },
      })
    );
  }

  await Promise.all(promises);

  res.redirect("/home");
});

app.post("/update-photos", middleware, (req: Request, res: Response) => {
  res.redirect("/albums");
});

app.post("/add-favorite", middleware, async (req: Request, res: Response) => {
  const { photoid, origin }: { photoid: string; origin: string } = req.body;

  await Photo.findByIdAndUpdate(photoid, {
    $set: { favorite: true },
  });

  res.redirect(origin);
});
app.post(
  "/remove-favorite",
  middleware,
  async (req: Request, res: Response) => {
    const { photoid, origin }: { photoid: string; origin: string } = req.body;

    await Photo.findByIdAndUpdate(photoid, {
      $set: { favorite: false },
    });

    res.redirect(origin);
  }
);

app.post(
  "/auth",
  middlewareHome,
  async (req: Request, res: Response, next: NextFunction) => {
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
  }
);

app.post(
  "/register",
  middlewareHome,
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
