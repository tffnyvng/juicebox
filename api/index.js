const jwt = require("jsonwebtoken");
const { getUserById } = require("../db");
const { JWT_SECRET } = process.env;

const express = require("express");
const apiRouter = express.Router();
const usersRouter = require("./users");
const postsRouter = require("./posts");
const tagsRouter = require("./tags");

//middleware should be going before routers
//this is token/JWT middleware
apiRouter.use(async (req, res, next) => {
  const prefix = "Bearer ";
  const auth = req.header("Authorization");

  if (!auth) {
    next();
    // return;
  } else if (auth.startsWith(prefix)) {
    const token = auth.slice(prefix.length);

    try {
      const { id } = jwt.verify(token, JWT_SECRET);
      console.log("this is the id:", id);
      if (id) {
        req.user = await getUserById(id);
        next();
      }
    } catch ({ name, message }) {
      next({ name, message });
    }
  } else {
    next({
      name: "AuthorizationHeaderError",
      message: `Authorization token must start with ${prefix}`,
    });
  }
});

apiRouter.use((req, res, next) => {
  if (req.user) {
    console.log("User is set:", req.user);
  }

  next();
});

//these are middleware
apiRouter.use("/users", usersRouter);

apiRouter.use("/posts", postsRouter);

apiRouter.use("/tags", tagsRouter);

//this is error handling middleware for apiRouter
apiRouter.use((error, req, res, next) => {
  res.send({
    name: error.name,
    message: error.message,
  });
});

module.exports = apiRouter;
