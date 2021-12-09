import express, { NextFunction, Request, Response } from "express";
import { middleware, middlewareHome } from "../middleware/auth.middleware";
import mongoose from "mongoose";
import multer from "multer";

import User, { IUser } from "../model/user.model";
import Album, { IAlbum } from "../model/album.model";
import Photo, { IPhoto } from "../model/photo.model";

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

export const router = express.Router();

router.get("/home", middleware, async (req: Request, res: Response) => {
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

router.post(
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
