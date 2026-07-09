const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

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
    INSERT INTO todos (content)
    SELECT 'Learn Kubernetes basics'
    WHERE NOT EXISTS (SELECT 1 FROM todos);
  `);

  await pool.query(`
    INSERT INTO todos (content)
    SELECT 'Deploy application to cluster'
    WHERE NOT EXISTS (SELECT 1 FROM todos WHERE content = 'Deploy application to cluster');
  `);

  await pool.query(`
    INSERT INTO todos (content)
    SELECT 'Configure persistent volumes'
    WHERE NOT EXISTS (SELECT 1 FROM todos WHERE content = 'Configure persistent volumes');
  `);
};

app.get("/todos", async (req, res) => {
  const result = await pool.query("SELECT id, content FROM todos ORDER BY id;");
  res.json(result.rows);
});

app.post("/todos", async (req, res) => {
  const { content } = req.body;

  if (!content || content.length > 140) {
    return res.status(400).json({ error: "Todo must be 1-140 characters" });
  }

  const result = await pool.query(
    "INSERT INTO todos (content) VALUES ($1) RETURNING id, content;",
    [content]
  );

  res.status(201).json(result.rows[0]);
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Todo backend started in port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
