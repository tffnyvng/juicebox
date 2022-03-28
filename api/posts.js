const express = require("express");
const postsRouter = express.Router();
const { getAllPosts, createPost, updatePost, getPostsById } = require("../db");
const { requireUser } = require("./utils");

postsRouter.use((req, res, next) => {
  console.log("A request is being made to /posts");

  next();
});

postsRouter.get("/", async (req, res) => {
  let posts = await getAllPosts();
  posts = posts.filter((post) => {
    if (post.active) {
      return true;
    }

    if (req.user && post.author.id === req.user.id) {
      return true;
    }

    return false;
  });

  res.send({
    posts,
  });
});

postsRouter.post("/", requireUser, async (req, res, next) => {
  const { title, content, tags = "" } = req.body;

  const tagsArr = tags.trim().split(/\s+/);
  let postData = {};

  if (tagsArr.length) {
    postData.tags = tagsArr;
  }

  try {
    postData = { ...postData, author_id: req.user.id, title, content };

    const post = await createPost(postData);
    if (post) {
      res.send({ post });
    } else {
      next({
        name: "PostCreationError",
        message: "Post creation failed.",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.patch("/:post_id", requireUser, async (req, res, next) => {
  const { post_id } = req.params;
  const { title, content, tags } = req.body;
  let updateFields = {};

  if (tags && tags.length > 0) {
    updateFields.tags = tags.trim().split(/\s+/);
  }

  if (title) {
    updateFields.title = title;
  }

  if (content) {
    updateFields.content = content;
  }

  try {
    const originalPost = await getPostsById(post_id);

    if (originalPost.author.id === req.user.id) {
      const updatedPost = await updatePost(post_id, updateFields);
      res.send({ post: updatedPost });
    } else {
      next({
        name: "UnauthorizedUserError",
        message: "Users can only edit posts they have authored.",
      });
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

postsRouter.delete("/:post_id", requireUser, async (req, res, next) => {
  try {
    const post = await getPostsById(req.params.post_id);

    if (post && post.author.id === req.user.id) {
      const updatedPost = await updatePost(post.id, { active: false });
      res.send({ post: updatedPost });
    } else {
      next(
        post
          ? {
              name: "UnauthorizedUserError",
              message: "Users can only delete posts they have authored",
            }
          : {
              name: "PostNotFoundError",
              message: "Post does not exist",
            }
      );
    }
  } catch ({ name, message }) {
    next({ name, message });
  }
});

module.exports = postsRouter;
