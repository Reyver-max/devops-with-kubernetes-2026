const express = require("express");
const { Pool } = require("pg");
const { connect, StringCodec } = require("nats");

const app = express();

const PORT = Number(process.env.PORT || 3000);
const MAX_TODO_LENGTH = Number(process.env.MAX_TODO_LENGTH || 140);

const NATS_URL =
  process.env.NATS_URL || "nats://my-nats.nats.svc.cluster.local:4222";

const NATS_SUBJECT =
  process.env.NATS_SUBJECT || "todo.events";

const sc = StringCodec();

let natsConnection;

app.use(express.json());

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "todo-postgres-svc",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "todos",
});

/*
 * Connect to NATS.
 */
const connectToNats = async () => {
  natsConnection = await connect({
    servers: NATS_URL,
  });

  console.log(
    JSON.stringify({
      event: "nats_connected",
      server: NATS_URL,
    })
  );
};

/*
 * Publish a todo status message to NATS.
 */
const publishTodoEvent = (message) => {
  if (!natsConnection) {
    console.error("Cannot publish: NATS is not connected");
    return;
  }

  const event = {
    user: "todo-backend",
    message,
  };

  natsConnection.publish(
    NATS_SUBJECT,
    sc.encode(JSON.stringify(event))
  );

  console.log(
    JSON.stringify({
      event: "nats_message_published",
      subject: NATS_SUBJECT,
      message,
    })
  );
};

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
    return res.status(400).json({
      error: "Todo content is required",
    });
  }

  if (content.length > MAX_TODO_LENGTH) {
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

    publishTodoEvent(
      `A todo was created: ${createdTodo.content}`
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

    publishTodoEvent(
      `A todo was updated: ${updatedTodo.content}`
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

/*
 * Initialize dependencies before starting the HTTP server.
 */
const start = async () => {
  try {
    await initializeDatabase();
    await connectToNats();

    app.listen(PORT, () => {
      console.log(
        JSON.stringify({
          event: "server_started",
          port: PORT,
          maximumTodoLength: MAX_TODO_LENGTH,
        })
      );
    });
  } catch (error) {
    console.error(
      JSON.stringify({
        event: "startup_failed",
        message: error.message,
      })
    );

    process.exit(1);
  }
};

start();
