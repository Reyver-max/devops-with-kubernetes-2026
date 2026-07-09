const express = require("express");
const { Pool } = require("pg");

const app = express();
const PORT = process.env.PORT || 3000;

const pool = new Pool({
  host: process.env.POSTGRES_HOST || "postgres-svc",
  port: Number(process.env.POSTGRES_PORT || 5432),
  user: process.env.POSTGRES_USER || "postgres",
  password: process.env.POSTGRES_PASSWORD || "postgres",
  database: process.env.POSTGRES_DB || "pingpong",
});

const initializeDatabase = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS pingpong (
      id INT PRIMARY KEY,
      count INT NOT NULL
    );
  `);

  await pool.query(`
    INSERT INTO pingpong (id, count)
    VALUES (1, 0)
    ON CONFLICT (id) DO NOTHING;
  `);
};

const getCounter = async () => {
  const result = await pool.query("SELECT count FROM pingpong WHERE id = 1;");
  return result.rows[0].count;
};

const incrementCounter = async () => {
  await pool.query("UPDATE pingpong SET count = count + 1 WHERE id = 1;");
};

app.get("/pingpong", async (req, res) => {
  try {
    const counter = await getCounter();
    await incrementCounter();
    res.send(`pong ${counter}`);
  } catch (error) {
    console.error("Error in /pingpong:", error);
    res.status(500).send("Database error");
  }
});

app.get("/pings", async (req, res) => {
  try {
    const counter = await getCounter();
    res.send(String(counter));
  } catch (error) {
    console.error("Error in /pings:", error);
    res.status(500).send("Database error");
  }
});

initializeDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Ping-pong app started in port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Failed to initialize database:", error);
    process.exit(1);
  });
