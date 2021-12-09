import express, { NextFunction, Request, Response } from "express";
import { middlewareHome } from "../middleware/auth.middleware";

import User, { IUser } from "../model/user.model";
import Album, { IAlbum } from "../model/album.model";
import Photo, { IPhoto } from "../model/photo.model";

export const router = express.Router();

router.get("/login", middlewareHome, (req: Request, res: Response) => {
  res.render("login/index");
});

router.get("/signup", middlewareHome, (req: Request, res: Response) => {
  res.render("login/signup");
});

router.post(
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
          req.session.user = user;
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

router.post(
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
