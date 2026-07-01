const express = require("express");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

let todos = [
  { id: 1, content: "Learn Kubernetes basics" },
  { id: 2, content: "Deploy application to cluster" },
  { id: 3, content: "Configure persistent volumes" },
];

app.get("/todos", (req, res) => {
  res.json(todos);
});

app.post("/todos", (req, res) => {
  const { content } = req.body;

  if (!content || content.length > 140) {
    return res.status(400).json({ error: "Todo must be 1-140 characters" });
  }

  const todo = {
    id: Date.now(),
    content,
  };

  todos.push(todo);
  res.status(201).json(todo);
});

app.listen(PORT, () => {
  console.log(`Todo backend started in port ${PORT}`);
});
