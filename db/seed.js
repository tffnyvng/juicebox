const {
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
} = require("./index");

//function to drop all tables from db
async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS users;
    `);

    console.log("Finished dropping tables!");
  } catch (err) {
    console.error("Error dropping tables!");
    throw err;
  }
}

//function to create all tables from db
async function createTables() {
  try {
    console.log("Starting to build tables...");

    await client.query(`
    CREATE TABLE users(
      id SERIAL PRIMARY KEY, 
      username varchar(255) UNIQUE NOT NULL,
      password varchar(255) NOT NULL,
      name varchar(255) NOT NULL,
      location varchar(255) NOT NULL,
      active BOOLEAN DEFAULT true
    );
    CREATE TABLE posts(
  id SERIAL PRIMARY KEY,
  author_id INTEGER REFERENCES users(id) NOT NULL,
  title varchar(255) NOT NULL,
  content TEXT NOT NULL,
  active BOOLEAN DEFAULT true
);
    `);

    console.log("Finished building tables!");
  } catch (err) {
    console.error("Error building tables!");
    throw err;
  }
}

async function createInitialUsers() {
  try {
    console.log("Starting to create users...");

    const albert = await createUser({
      username: "albert",
      password: "bertie99",
      name: "Al Bert",
      location: "Sidney, Australia",
    });
    const sandra = await createUser({
      username: "sandra",
      password: "2sandy4me",
      name: "Just Sandra",
      location: "Ain't tellin'",
    });
    const glamgal = await createUser({
      username: "glamgal",
      password: "soglam",
      name: "Joshua",
      location: "Upper East Side",
    });

    console.log("Finished creating users!");
  } catch (err) {
    console.error("Error creating users!");
    throw err;
  }
}

async function createInitalPosts() {
  try {
    console.log("Starting to create posts...");
    const [albert, sandra, glamgal] = await getAllUsers();

    await createPost({
      author_id: albert.id,
      title: "Hey this is my first post.",
      content: "How do you work this thing?",
    });

    await createPost({
      author_id: sandra.id,
      title: "Whoa, hey look at this!",
      content: "I found this little starconch over there! Ain't it cute?",
    });

    await createPost({
      author_id: glamgal.id,
      title: "Living the Glam Life",
      content: "A new site huh? Let's see how long this lasts.",
    });

    console.log("Finished creating posts!");
  } catch (err) {
    console.error("Error creating posts!");
    throw err;
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitalPosts();
  } catch (err) {
    console.error(err);
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Results:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Results:", posts);

    console.log("Calling updatePost on post[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "Actually...",
      content: "I'm getting the hang of this!",
    });
    console.log("Result", updatePostResult);

    console.log("Finished database tests!");
  } catch (err) {
    console.log("Error testing database!");

    throw err;
  }
}

rebuildDB()
  .then(testDB)
  .catch(console.error)
  .finally(() => client.end());
