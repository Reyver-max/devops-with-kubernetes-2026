const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();

const PORT = process.env.PORT || 3000;
const IMAGE_URL =
  process.env.IMAGE_URL || "https://picsum.photos/1200";

const TODO_BACKEND_URL =
  process.env.TODO_BACKEND_URL ||
  "http://todo-backend-svc:2345";

const filesDir = "/usr/src/app/files";
const imagePath = path.join(filesDir, "image.jpg");
const timestampPath = path.join(
  filesDir,
  "image-timestamp.txt"
);

const TEN_MINUTES = 10 * 60 * 1000;

/*
 * Exercise 4.2:
 *
 * Pressing the "break the app" button changes this to false.
 * The liveness probe then fails and Kubernetes restarts
 * the container.
 *
 * Since this variable exists only in memory, the new container
 * starts again with isHealthy = true.
 */
let isHealthy = true;

app.use(express.urlencoded({ extended: true }));

const ensureFilesDir = () => {
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, { recursive: true });
  }
};

const imageIsFresh = () => {
  if (
    !fs.existsSync(imagePath) ||
    !fs.existsSync(timestampPath)
  ) {
    return false;
  }

  const timestamp = Number(
    fs.readFileSync(timestampPath, "utf8")
  );

  return Date.now() - timestamp < TEN_MINUTES;
};

const downloadImage = async () => {
  ensureFilesDir();

  if (imageIsFresh()) {
    return;
  }

  const response = await fetch(IMAGE_URL);
  const arrayBuffer = await response.arrayBuffer();

  fs.writeFileSync(
    imagePath,
    Buffer.from(arrayBuffer)
  );

  fs.writeFileSync(
    timestampPath,
    String(Date.now())
  );
};

const getTodos = async () => {
  const response = await fetch(
    `${TODO_BACKEND_URL}/todos`
  );

  if (!response.ok) {
    throw new Error(
      `Backend returned ${response.status}`
    );
  }

  return await response.json();
};

/*
 * Readiness probe.
 *
 * The frontend is ready only if:
 * 1. the frontend itself is healthy
 * 2. the backend is healthy
 * 3. by implication, the backend can reach PostgreSQL
 */
app.get("/healthz", async (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({
      status: "unhealthy",
    });
  }

  try {
    const response = await fetch(
      `${TODO_BACKEND_URL}/healthz`
    );

    if (!response.ok) {
      return res.status(500).json({
        status: "backend unhealthy",
      });
    }

    return res.status(200).json({
      status: "ok",
    });
  } catch (error) {
    console.error(
      "Frontend health check failed:",
      error.message
    );

    return res.status(500).json({
      status: "backend unavailable",
    });
  }
});

/*
 * Liveness endpoint.
 *
 * Pressing the break button makes this return 500,
 * which causes Kubernetes to restart this container.
 */
app.get("/livez", (req, res) => {
  if (!isHealthy) {
    return res.status(500).json({
      status: "unhealthy",
    });
  }

  return res.status(200).json({
    status: "alive",
  });
});

app.post("/break", (req, res) => {
  console.log("Breaking Todo application intentionally");

  isHealthy = false;

  return res.redirect("/");
});

app.get("/", async (req, res) => {
  if (!isHealthy) {
    return res.status(500).send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 40px;
              background: #fff8f8;
            }

            .failure {
              max-width: 700px;
              margin: 80px auto;
              padding: 40px;
              border: 1px solid #ef9a9a;
              border-radius: 8px;
              background: #ffebee;
              color: #b71c1c;
            }

            h1 {
              font-size: 42px;
            }

            p {
              font-size: 20px;
            }
          </style>
        </head>

        <body>
          <div class="failure">
            <h1>System Failure</h1>
            <p>
              The Todo App is currently unhealthy.
              Please wait for recovery.
            </p>
          </div>
        </body>
      </html>
    `);
  }

  try {
    await downloadImage();

    const todos = await getTodos();

    res.send(`
      <html>
        <head>
          <style>
            body {
              font-family: Arial, sans-serif;
              text-align: center;
              margin: 40px;
            }

            img {
              max-width: 400px;
              border-radius: 8px;
              box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            }

            form {
              margin-top: 32px;
            }

            input {
              width: 360px;
              padding: 12px;
              font-size: 16px;
            }

            button {
              padding: 12px 20px;
              font-size: 16px;
              margin-left: 8px;
            }

            ul {
              list-style: none;
              padding: 0;
              max-width: 600px;
              margin: 24px auto;
              text-align: left;
            }

            li {
              background: #f4f4f4;
              padding: 14px;
              margin-bottom: 10px;
              border-left: 4px solid #4caf50;
            }

            .break-button {
              background: #e53935;
              color: white;
              border: none;
              border-radius: 4px;
              cursor: pointer;
            }
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

            <button type="submit">
              Send
            </button>
          </form>

          <h2>Todos</h2>

          <ul>
            ${todos
              .map(
                (todo) =>
                  `<li>${todo.content}</li>`
              )
              .join("")}
          </ul>

          <form action="/break" method="POST">
            <button
              type="submit"
              class="break-button"
            >
              break the app
            </button>
          </form>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);

    res
      .status(500)
      .send("Failed to load Todo App");
  }
});

app.post("/todos", async (req, res) => {
  try {
    await fetch(`${TODO_BACKEND_URL}/todos`, {
      method: "POST",

      headers: {
        "Content-Type": "application/json",
      },

      body: JSON.stringify({
        content: req.body.content,
      }),
    });

    res.redirect("/");
  } catch (error) {
    console.error(error);

    res
      .status(500)
      .send("Failed to create todo");
  }
});

app.get("/image", (req, res) => {
  if (!fs.existsSync(imagePath)) {
    return res
      .status(404)
      .send("Image not found");
  }

  res.sendFile(imagePath);
});

app.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
