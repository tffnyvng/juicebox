require("dotenv").config();

const { PORT = 5500 } = process.env;
const express = require("express");
const server = express();
const morgan = require("morgan");
const { client } = require("./db");
const apiRouter = require("./api");

server.use(morgan("dev"));
server.use(express.json());

server.use("/api", apiRouter);

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});

client.connect();

server.listen(PORT, () => {
  console.log("The server is up on port", PORT);
});
