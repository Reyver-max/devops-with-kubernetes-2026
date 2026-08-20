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
 * Used to intentionally break the frontend.
 */
let isHealthy = true;

app.use(express.urlencoded({ extended: true }));

const ensureFilesDir = () => {
  if (!fs.existsSync(filesDir)) {
    fs.mkdirSync(filesDir, {
      recursive: true,
    });
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

  if (!response.ok) {
    throw new Error(
      `Image service returned ${response.status}`
    );
  }

  const arrayBuffer =
    await response.arrayBuffer();

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
 * Readiness endpoint.
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

/*
 * Exercise 4.2:
 * Intentionally break the frontend.
 */
app.post("/break", (req, res) => {
  console.log(
    "Breaking Todo application intentionally"
  );

  isHealthy = false;

  return res.redirect("/");
});

/*
 * Exercise 4.5:
 * Frontend route for marking a todo as done.
 *
 * HTML forms support GET and POST directly, so the frontend
 * receives POST and then performs the required PUT request
 * to the backend.
 */
app.post("/todos/:id/done", async (req, res) => {
  try {
    const response = await fetch(
      `${TODO_BACKEND_URL}/todos/${req.params.id}`,
      {
        method: "PUT",
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    return res.redirect("/");
  } catch (error) {
    console.error(
      "Failed to mark todo as done:",
      error.message
    );

    return res
      .status(500)
      .send("Failed to update todo");
  }
});

/*
 * Main page.
 */
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
              box-shadow:
                0 2px 8px rgba(0, 0, 0, 0.2);
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
              padding: 10px 16px;
              font-size: 14px;
              margin-left: 8px;
              cursor: pointer;
            }

            ul {
              list-style: none;
              padding: 0;
              max-width: 700px;
              margin: 24px auto;
              text-align: left;
            }

            li {
              background: #f4f4f4;
              padding: 14px;
              margin-bottom: 10px;
              border-left: 4px solid #4caf50;
              display: flex;
              justify-content: space-between;
              align-items: center;
            }

            .todo-content.done {
              text-decoration: line-through;
              opacity: 0.6;
            }

            .done-label {
              color: green;
              font-weight: bold;
            }

            .done-button {
              background: #1976d2;
              color: white;
              border: none;
              border-radius: 4px;
            }

            .break-button {
              background: #e53935;
              color: white;
              border: none;
              border-radius: 4px;
            }

            .inline-form {
              margin: 0;
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
                (todo) => `
                  <li>
                    <span
                      class="todo-content ${
                        todo.done ? "done" : ""
                      }"
                    >
                      ${todo.content}
                    </span>

                    ${
                      todo.done
                        ? `
                          <span class="done-label">
                            Done
                          </span>
                        `
                        : `
                          <form
                            action="/todos/${todo.id}/done"
                            method="POST"
                            class="inline-form"
                          >
                            <button
                              type="submit"
                              class="done-button"
                            >
                              Mark done
                            </button>
                          </form>
                        `
                    }
                  </li>
                `
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

    return res
      .status(500)
      .send("Failed to load Todo App");
  }
});

/*
 * Create a todo through the frontend.
 */
app.post("/todos", async (req, res) => {
  try {
    const response = await fetch(
      `${TODO_BACKEND_URL}/todos`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
        },

        body: JSON.stringify({
          content: req.body.content,
        }),
      }
    );

    if (!response.ok) {
      throw new Error(
        `Backend returned ${response.status}`
      );
    }

    return res.redirect("/");
  } catch (error) {
    console.error(error);

    return res
      .status(500)
      .send("Failed to create todo");
  }
});

/*
 * Serve cached image.
 */
app.get("/image", (req, res) => {
  if (!fs.existsSync(imagePath)) {
    return res
      .status(404)
      .send("Image not found");
  }

  return res.sendFile(imagePath);
});

app.listen(PORT, () => {
  console.log(
    `Server started in port ${PORT}`
  );
});
