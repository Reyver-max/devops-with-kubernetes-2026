const express = require("express");
const fs = require("fs");

const app = express();
const PORT = process.env.PORT || 3000;
const filePath = "/usr/src/app/files/pingpong.txt";

const getCounter = () => {
  try {
    return Number(fs.readFileSync(filePath, "utf8")) || 0;
  } catch {
    return 0;
  }
};

const setCounter = (value) => {
  fs.writeFileSync(filePath, String(value));
};

app.get("/pingpong", (req, res) => {
  const counter = getCounter();
  res.send(`pong ${counter}`);
  setCounter(counter + 1);
});

app.get("/pings", (req, res) => {
  const counter = getCounter();
  res.send(String(counter));
});

app.listen(PORT, () => {
  console.log(`Ping-pong app started in port ${PORT}`);
});
