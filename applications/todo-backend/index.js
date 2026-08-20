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

  await pool.query(`
    ALTER TABLE todos
    ADD COLUMN IF NOT EXISTS done BOOLEAN NOT NULL DEFAULT FALSE;
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

/*
 * Readiness endpoint.
 * The backend is ready only if PostgreSQL can answer a query.
 */
app.get("/healthz", async (req, res) => {
  try {
    await pool.query("SELECT 1;");

    return res.status(200).json({
      status: "ok",
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "health_check_failed",
        message: error.message,
      })
    );

    return res.status(500).json({
      status: "unhealthy",
    });
  }
});

/*
 * Liveness endpoint.
 * Checks whether the backend process itself is alive.
 */
app.get("/livez", (req, res) => {
  return res.status(200).json({
    status: "alive",
  });
});

/*
 * Get all todos.
 */
app.get("/todos", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT id, content, done FROM todos ORDER BY id;"
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

/*
 * Create a new todo.
 */
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
        RETURNING id, content, done;
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

/*
 * Mark a todo as done.
 *
 * Exercise 4.5 requires:
 * PUT /todos/<id>
 */
app.put("/todos/:id", async (req, res) => {
  const id = Number(req.params.id);

  if (!Number.isInteger(id) || id <= 0) {
    return res.status(400).json({
      error: "Invalid todo id",
    });
  }

  try {
    const result = await pool.query(
      `
        UPDATE todos
        SET done = TRUE
        WHERE id = $1
        RETURNING id, content, done;
      `,
      [id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: "Todo not found",
      });
    }

    const updatedTodo = result.rows[0];

    console.log(
      JSON.stringify({
        event: "todo_marked_done",
        todoId: updatedTodo.id,
        content: updatedTodo.content,
      })
    );

    return res.status(200).json(updatedTodo);
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "todo_update_failed",
        todoId: id,
        message: error.message,
      })
    );

    return res.status(500).json({
      error: "Failed to update todo",
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
