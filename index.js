const PORT = 5500;
const express = require("express");
const server = express();

const morgan = require("morgan");
server.use(morgan("dev"));
server.use(express.json());

const { client } = require("./db");
client.connect();

const apiRouter = require("./api");
server.use("/api", apiRouter);

server.listen(PORT, () => {
  console.log("The serve is up on port", PORT);
});

server.use((req, res, next) => {
  console.log("<____Body Logger START____>");
  console.log(req.body);
  console.log("<_____Body Logger END_____>");

  next();
});
