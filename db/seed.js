const {
  client,
  addTagsToPosts,
  createTags,
  createUser,
  createPost,
  getUserById,
  getAllUsers,
  getAllPosts,
  getPostsByTagName,
  updateUser,
  updatePost,
} = require("./index");

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


    CREATE TABLE tags(
      id SERIAL PRIMARY KEY, 
      name VARCHAR(255) UNIQUE NOT NULL
    );


    CREATE TABLE post_tags (
      post_id INTEGER REFERENCES posts(id),
      tag_id INTEGER REFERENCES tags(id),
      UNIQUE(post_id, tag_id)
    );     
    `);

    console.log("Finished building tables!");
  } catch (err) {
    console.error("Error building tables!");
    throw err;
  }
}

//function to drop all tables from db
async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
    DROP TABLE IF EXISTS post_tags;
    DROP TABLE IF EXISTS tags;
    DROP TABLE IF EXISTS posts;
    DROP TABLE IF EXISTS users;
    `);

    console.log("Finished dropping tables!");
  } catch (err) {
    console.error("Error dropping tables!");
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
      content:
        "This is my first post. I hope I love writing blogs as much as I love writing them.",
      tags: ["#happy", "#youcandoanything"],
    });

    await createPost({
      author_id: sandra.id,
      title: "Whoa, hey look at this!",
      content: "I found this little starconch over there! Ain't it cute?",
      tags: ["#happy", "#worst-day-ever"],
    });

    await createPost({
      author_id: glamgal.id,
      title: "Living the Glam Life",
      content: "A new site huh? Let's see how long this lasts.",
      tags: ["#happy", "#youcandoanything", "#canmandoeverything"],
    });

    console.log("Finished creating posts!");
  } catch (err) {
    console.error("Error creating posts!");
    throw err;
  }
}

//this function is no longer necessary bc we put the tags directly into the post above^^
// async function createInitalTags() {
//   try {
//     const [happy, sad, inspo, catman] = await createTags([
//       "#happy",
//       "#worst-day-ever",
//       "#youcandoanything",
//       "#catmandoanything",
//     ]);

//     const [post1, post2, post3] = await getAllPosts();

//     await addTagsToPosts(post1.id, [happy, inspo]);
//     await addTagsToPosts(post2.id, [sad, inspo]);
//     await addTagsToPosts(post3.id, [happy, catman, inspo]);
//   } catch (err) {
//     throw err;
//   }
// }

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
    await createInitalPosts();
    // await createInitalTags();
  } catch (err) {
    console.error(err);
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    console.log("Calling getAllUsers");
    const users = await getAllUsers();
    console.log("Result:", users);

    console.log("Calling updateUser on users[0]");
    const updateUserResult = await updateUser(users[0].id, {
      name: "Newname Sogood",
      location: "Lesterville, KY",
    });
    console.log("Result:", updateUserResult);

    console.log("Calling getAllPosts");
    const posts = await getAllPosts();
    console.log("Result:", JSON.stringify({ posts }, null, 2));

    console.log("Calling updatePost on post[0]");
    const updatePostResult = await updatePost(posts[0].id, {
      title: "Actually...",
      content: "I'm getting the hang of this!",
    });
    console.log("Result", updatePostResult);

    console.log("Calling getUserById with 1");
    const albert = await getUserById(1);
    console.log(
      "Result:",
      JSON.stringify({ albert, albertPosts: albert.posts }, null, 2)
    );

    console.log("Calling updatePostsTagsResult");
    const updatePostTagsResult = await updatePost(posts[1].id, {
      tags: ["#youcandoanything", "#redfish", "#bluefish", "#happy"],
    });
    console.log("Result:", updatePostTagsResult);

    console.log("Calling getPostsByTagName");
    const postsWithHappy = await getPostsByTagName("#happy");
    console.log("Result:", JSON.stringify({ postsWithHappy }, null, 2));

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
