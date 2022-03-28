const express = require("express");
const tagsRouter = express.Router();
const { getAllTags, getPostsByTagName } = require("../db");

tagsRouter.use((req, res, next) => {
  console.log("A request is being made to /tags");

  next();
});

tagsRouter.get("/", async (req, res) => {
  const tags = await getAllTags();

  res.send({
    tags,
  });
});

tagsRouter.get("/:tagName/posts", async (req, res, next) => {
  const { tagName } = req.params;

  try {
    let posts = await getPostsByTagName(tagName);

    posts = posts.filter((post) => {
      if (post.active) {
        return true;
      }

      //this one causes the issues
      if (req.user.id && post.author.id === req.user.id) {
        return true;
      }

      return false;
    });

    res.send({ posts });
  } catch ({ name, message }) {
    next({ name, message });
  }
});
module.exports = tagsRouter;
