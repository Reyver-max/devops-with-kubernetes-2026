const express = require("express");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

const filesDir = "/usr/src/app/files";
const imagePath = path.join(filesDir, "image.jpg");
const timestampPath = path.join(filesDir, "image-timestamp.txt");

const TEN_MINUTES = 10 * 60 * 1000;

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
  const buffer = Buffer.from(arrayBuffer);

  fs.writeFileSync(imagePath, buffer);
  fs.writeFileSync(timestampPath, String(Date.now()));
};

app.get("/", async (req, res) => {
  try {
    await downloadImage();

    res.send(`
      <html>
        <body style="font-family: sans-serif; text-align: center;">
          <h1>Todo App</h1>
          <img src="/image" style="max-width: 600px; border-radius: 8px;" />
          <p>DevOps with Kubernetes 2026</p>
        </body>
      </html>
    `);
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to load image");
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
