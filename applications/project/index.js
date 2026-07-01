const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const filesDir = "/usr/src/app/files";
const imagePath = path.join(filesDir, "image.jpg");
const timestampPath = path.join(filesDir, "image-timestamp.txt");

const TEN_MINUTES = 10 * 60 * 1000;
const TODO_BACKEND_URL = "http://todo-backend-svc:2345";

const ensureFilesDir = () => {
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }
};

const imageIsFresh = () => {
  if (!fs.existsSync(imagePath) || !fs.existsSync(timestampPath)) {
    return false;
  }

  const timestamp = Number(fs.readFileSync(timestampPath, "utf8"));
  return Date.now() - timestamp < TEN_MINUTES;
};

const downloadImage = async () => {
  ensureFilesDir();

  if (imageIsFresh()) {
    return;
  }

  const response = await fetch("https://picsum.photos/1200");
  const arrayBuffer = await response.arrayBuffer();

  fs.writeFileSync(imagePath, Buffer.from(arrayBuffer));
  fs.writeFileSync(timestampPath, String(Date.now()));
};

const getTodos = async () => {
  const response = await fetch(`${TODO_BACKEND_URL}/todos`);
  return await response.json();
};

app.use(express.urlencoded({ extended: true }));

app.get("/", async (req, res) => {
  try {
    await downloadImage();
    const todos = await getTodos();

    res.send(`
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; text-align: center; margin: 40px; }
            img { max-width: 400px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.2); }
            form { margin-top: 32px; }
            input { width: 360px; padding: 12px; font-size: 16px; }
            button { padding: 12px 20px; font-size: 16px; margin-left: 8px; }
            ul { list-style: none; padding: 0; max-width: 600px; margin: 24px auto; text-align: left; }
            li { background: #f4f4f4; padding: 14px; margin-bottom: 10px; border-left: 4px solid #4caf50; }
          </style>
        </head>
        <body>
          <h1>Todo App</h1>

          <img src="/image" />

          <form action="/todos" method="POST">
            <input
              type="text"
              name="content"
              maxlength="140"
              placeholder="Enter a new todo (max 140 characters)"
              required
            />
            <button type="submit">Send</button>
          </form>

          <h2>Todos</h2>

          <ul>
            ${todos.map((todo) => `<li>${todo.content}</li>`).join("")}
          </ul>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load Todo App");
  }
});

app.post("/todos", async (req, res) => {
  try {
    await fetch(`${TODO_BACKEND_URL}/todos`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: req.body.content }),
    });

    res.redirect("/");
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to create todo");
  }
});

app.get("/image", (req, res) => {
  if (!fs.existsSync(imagePath)) {
    return res.status(404).send("Image not found");
  }

  res.sendFile(imagePath);
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
