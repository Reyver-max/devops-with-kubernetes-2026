const express = require("express");

const app = express();

const PORT = process.env.PORT || 3000;

app.get("/", (req, res) => {
  res.send("Todo App");
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});