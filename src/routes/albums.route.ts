import express, { NextFunction, Request, Response } from "express";
import { middleware, middlewareHome } from "../middleware/auth.middleware";

export const router = express.Router();

import User, { IUser } from "../model/user.model";
import Album, { IAlbum } from "../model/album.model";
import Photo, { IPhoto } from "../model/photo.model";

router.get(
  "/albums",
  middleware,
  async (req: Request, res: Response, next: NextFunction) => {
    const albums = await Album.find({ userid: req.session.user._id! });
    res.render("albums/index", { user: req.session.user, albums: albums });
  }
);

router.get(
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

router.post("/create-album", middleware, (req: Request, res: Response) => {
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
