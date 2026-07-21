const express = require("express");
const { Pool } = require("pg");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const MAX_TODO_LENGTH = Number(process.env.MAX_TODO_LENGTH || 140);

app.use(express.json());

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "todo-postgres-svc",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "todos",
});

const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS todos (
      id SERIAL PRIMARY KEY,
      content TEXT NOT NULL
    );
  `);

  const initialTodos = [
    "Learn Kubernetes basics",
    "Deploy application to cluster",
    "Configure persistent volumes",
  ];

  for (const content of initialTodos) {
    await pool.query(
      `
        INSERT INTO todos (content)
        SELECT $1
        WHERE NOT EXISTS (
          SELECT 1
          FROM todos
          WHERE content = $1
        );
      `,
      [content]
    );
  }
};

app.get("/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, content FROM todos ORDER BY id;"
    );

    return res.json(result.rows);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "todos_fetch_failed",
        message: error.message,
      })
    );

    return res.status(500).json({
      error: "Failed to retrieve todos",
    });
  }
});

app.post("/todos", async (req, res) => {
  const content =
    typeof req.body.content === "string"
      ? req.body.content.trim()
      : "";

  console.log(
    JSON.stringify({
      event: "todo_received",
      method: req.method,
      path: req.path,
      content,
      contentLength: content.length,
    })
  );

  if (!content) {
    console.warn(
      JSON.stringify({
        event: "todo_rejected",
        reason: "empty_content",
        contentLength: 0,
      })
    );

    return res.status(400).json({
      error: "Todo content is required",
    });
  }

  if (content.length > MAX_TODO_LENGTH) {
    console.warn(
      JSON.stringify({
        event: "todo_rejected",
        reason: "content_too_long",
        contentLength: content.length,
        maximumLength: MAX_TODO_LENGTH,
        content,
      })
    );

    return res.status(400).json({
      error: `Todo must be at most ${MAX_TODO_LENGTH} characters`,
    });
  }

  try {
    const result = await pool.query(
      `
        INSERT INTO todos (content)
        VALUES ($1)
        RETURNING id, content;
      `,
      [content]
    );

    const createdTodo = result.rows[0];

    console.log(
      JSON.stringify({
        event: "todo_created",
        todoId: createdTodo.id,
        content: createdTodo.content,
      })
    );

    return res.status(201).json(createdTodo);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "todo_create_failed",
        message: error.message,
        content,
      })
    );

    return res.status(500).json({
      error: "Failed to create todo",
    });
  }
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(
        JSON.stringify({
          event: "server_started",
          port: PORT,
          maximumTodoLength: MAX_TODO_LENGTH,
        })
      );
    });
  })
  .catch((error) => {
    console.error(
      JSON.stringify({
        event: "database_initialization_failed",
        message: error.message,
      })
    );

    process.exit(1);
  });
