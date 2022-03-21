const { client, getAllUsers, createUser } = require("./index");

//function to drop all tables from db
async function dropTables() {
  try {
    console.log("Starting to drop tables...");

    await client.query(`
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
    console.log("Starting to build tablers...");

    await client.query(`
    CREATE TABLE users(
      id SERIAL PRIMARY KEY, 
      username varchar(255) UNIQUE NOT NULL,
      password varchar(255) NOT NULL
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
    });
    const sandra = await createUser({
      username: "sandra",
      password: "2sandy4me",
    });
    const glamgal = await createUser({
      username: "glamgal",
      password: "soglam",
    });

    console.log(albert);

    console.log(sandra);

    console.log(glamgal);

    console.log("Finished creating users!");
  } catch (err) {
    console.error("Error creating users!");
    throw err;
  }
}

async function rebuildDB() {
  try {
    client.connect();

    await dropTables();
    await createTables();
    await createInitialUsers();
  } catch (err) {
    console.error(err);
  }
}

async function testDB() {
  try {
    console.log("Starting to test database...");

    const users = await getAllUsers();

    console.log("getAllUsers:", users);

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
