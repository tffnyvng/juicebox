const { Client } = require("pg");

const client = new Client("postgres://localhost:5432/juicebox-dev");

async function getAllUsers() {
  const { rows } = await client.query(
    `SELECT id, username, name, location, active
        FROM users;
        `
  );

  return rows;
}

async function getUserById(userId) {
  try {
    const {
      rows: [user],
    } = await client.query(`
  SELECT id, username, name, location, active
  FROM users
  WHERE id=${userId};
  `);

    if (!user) {
      return null;
    }

    user.posts = await getPostsByUser(userId);

    return user;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

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

async function createPost({ author_id, title, content }) {
  try {
    const {
      rows: [post],
    } = await client.query(
      `
    INSERT INTO posts(author_id, title, content)
    VALUES ($1, $2, $3)
    RETURNING *
    `,
      [author_id, title, content]
    );
    return post;
  } catch (err) {
    throw err;
  }
}

async function updatePost(id, fields = {}) {
  const setString = Object.keys(fields)
    .map((key, index) => `"${key}"=$${index + 1}`)
    .join(", ");

  if (setString.length === 0) {
    return;
  }

  try {
    const {
      rows: [post],
    } = await client.query(
      `

        UPDATE posts
        SET ${setString}
        WHERE id=${id}
        RETURNING *;
        `,
      Object.values(fields)
    );

    return post;
  } catch (err) {
    throw err;
  }
}

async function getAllPosts() {
  try {
    const { rows } = await client.query(
      `SELECT *
        FROM posts;
        `
    );

    return rows;
  } catch (err) {
    throw err;
  }
}

async function getPostsByUser(userId) {
  try {
    const { rows } = client.query(`
    SELECT * FROM posts
    WHERE author_id=${userId};
    `);

    return rows;
  } catch (err) {
    throw err;
  }
}

async function getPostsByUserId(userId) {
  try {
    const { rows } = await client.query(`
      SELECT * 
      FROM posts
      WHERE author_id=${userId};
    `);

    return rows;
  } catch (err) {
    console.error(err);
    throw err;
  }
}

module.exports = {
  client,
  createUser,
  createPost,
  getUserById,
  getAllUsers,
  getPostsByUserId,
  getPostsByUser,
  getAllPosts,
  updateUser,
  updatePost,
};
