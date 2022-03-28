const { Client } = require("pg");

const client = new Client("postgres://localhost:5432/juicebox-dev");

//GET
async function getAllUsers() {
  try {
    const { rows } = await client.query(
      `SELECT id, username
        FROM users;
        `
    );

    return rows;
  } catch (err) {
    throw err;
  }
}

async function getUserById(user_id) {
  try {
    const {
      rows: [user],
    } = await client.query(`
  SELECT id, username, name, location, active
  FROM users
  WHERE id=${user_id};
  `);

    if (!user || (user && !user.id)) {
      return null;
    }

    user.posts = await getPostsByUser(user_id);

    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

async function getAllPosts() {
  try {
    const { rows: post_id } = await client.query(
      `SELECT id
        FROM posts;
        `
    );
    const posts = await Promise.all(post_id.map(({ id }) => getPostsById(id)));

    return posts;
  } catch (err) {
    throw err;
  }
}

//this function is used only in index so we don't export this one
async function getPostsByUser(user_id) {
  try {
    const { rows: post_id } = await client.query(`
    SELECT id FROM posts
    WHERE posts.author_id=${user_id};
    `);

    const posts = await Promise.all(post_id.map(({ id }) => getPostsById(id)));

    return posts;
  } catch (err) {
    throw err;
  }
}

async function getPostsById(post_id) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
  SELECT * 
  FROM posts
  WHERE id=$1;
  `,
      [post_id]
    );

    if (!post) {
      throw {
        name: "PostNotFoundError",
        message: "Post not found",
      };
    }

    const { rows: tags } = await client.query(
      `
  SELECT tags.* 
  FROM tags
  JOIN post_tags ON tags.id=post_tags.tag_id
  WHERE post_tags.post_id=$1;
  `,
      [post_id]
    );

    const {
      rows: [author],
    } = await client.query(
      `
  SELECT id, username, name, location 
  FROM users
  WHERE id=$1;
  `,
      [post.author_id]
    );

    post.tags = tags;

    post.author = author;

    delete post.author_id;

    return post;
  } catch (err) {
    throw err;
  }
}

async function getPostsByTagName(tagName) {
  try {
    const { rows: post_ids } = await client.query(
      `
    SELECT posts.id
    FROM posts
    JOIN post_tags ON posts.id=post_tags.post_id
    JOIN tags ON tags.id=post_tags.tag_id
    WHERE tags.name=$1;
    `,
      [tagName]
    );

    return await Promise.all(post_ids.map((post) => getPostsById(post.id)));
  } catch (err) {
    throw err;
  }
}

async function getAllTags() {
  try {
    const { rows: tags } = await client.query(
      `SELECT *
        FROM tags;
        `
    );

    return tags;
  } catch (err) {
    throw err;
  }
}

async function getUserByUsername(username) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
    SELECT * 
    FROM users
    WHERE username = $1;
    `,
      [username]
    );

    return user;
  } catch (err) {
    throw err;
  }
}

//CREATE
async function createUser({ username, password, name, location }) {
  try {
    const {
      rows: [user],
    } = await client.query(
      `
        INSERT INTO users(username, password, name, location)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (username) DO NOTHING
        RETURNING *;
    `,
      [username, password, name, location]
    );

    return user;
  } catch (err) {
    throw err;
  }
}

async function createPost({ author_id, title, content, tags = [] }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
    INSERT INTO posts(author_id, title, content)
    VALUES ($1, $2, $3)
    RETURNING *;
    `,
      [author_id, title, content]
    );

    const tagList = await createTags(tags);

    return await addTagsToPosts(post.id, tagList);
  } catch (err) {
    throw err;
  }
}

async function createTags(tagList) {
  if (tagList.length === 0) {
    return;
  }

  const insertValues = tagList.map((_, index) => `$${index + 1}`).join("), (");

  const selectValues = tagList.map((_, index) => `$${index + 1}`).join(", ");

  try {
    await client.query(
      `
    INSERT INTO tags(name)
    VALUES(${insertValues})
    ON CONFLICT (name) DO NOTHING
    RETURNING *;
    `,
      tagList
    );

    const { rows } = await client.query(
      `
    SELECT * FROM tags
    WHERE tags.name IN (${selectValues});
    `,
      tagList
    );

    return rows;
  } catch (err) {
    throw err;
  }
}

// POST_TAG THROUGH TABLE!! //
async function createPostTag(post_id, tag_id) {
  try {
    await client.query(
      `
    INSERT INTO post_tags(post_id, tag_id)
    VALUES ($1, $2)
    ON CONFLICT (post_id, tag_id) DO NOTHING;

    `,
      [post_id, tag_id]
    );
  } catch (err) {
    throw err;
  }
}

async function addTagsToPosts(post_id, tagList) {
  try {
    const createPostTagPromises = tagList.map((tag) =>
      createPostTag(post_id, tag.id)
    );

    await Promise.all(createPostTagPromises);

    return await getPostsById(post_id);
  } catch (err) {
    throw err;
  }
}

//UPDATE
async function updateUser(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [user],
    } = await client.query(
      `

        UPDATE users
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `,
      Object.values(fields)
    );

    return user;
  } catch (err) {
    throw err;
  }
}

async function updatePost(post_id, fields = {}) {
  const { tags } = fields;
  delete fields.tags;

  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  try {
    if (setString.length > 0) {
      await client.query(
        `
      UPDATE posts
      SET ${setString}
      WHERE id=${post_id}
      RETURNING *;
    `,
        Object.values(fields)
      );
    }

    if (tags === undefined) {
      return await getPostsById(post_id);
    }

    const tagList = await createTags(tags);

    const tagListIdString = tagList.map((tag) => `${tag.id}`).join(", ");

    await client.query(
      `
    DELETE FROM post_tags
    WHERE tag_id
    NOT IN (${tagListIdString})
    AND post_id=$1;
    `,
      [post_id]
    );

    await addTagsToPosts(post_id, tagList);

    return await getPostsById(post_id);
  } catch (error) {
    throw error;
  }
}

module.exports = {
  client,
  createUser,
  createPost,
  addTagsToPosts,
  createTags,
  getUserById,
  getAllUsers,
  getAllPosts,
  getPostsById,
  getAllTags,
  getPostsByTagName,
  getUserByUsername,
  updateUser,
  updatePost,
};
