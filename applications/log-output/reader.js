const http = require("http");
const crypto = require("crypto");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const MESSAGE = process.env.MESSAGE || "";
const randomString = crypto.randomUUID();
const infoFilePath = "/usr/src/app/config/information.txt";

const getPingCount = async () => {
  try {
    const response = await fetch("http://ping-pong-svc:2345/pings");
    return await response.text();
  } catch (error) {
    console.error("Failed to fetch ping count:", error);
    return "0";
  }
};

const getFileContent = () => {
  try {
    return fs.readFileSync(infoFilePath, "utf8").trim();
  } catch (error) {
    console.error("Failed to read information.txt:", error);
    return "";
  }
};

const server = http.createServer(async (req, res) => {
  const pingCount = await getPingCount();
  const fileContent = getFileContent();

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(
    `file content: ${fileContent}\n` +
    `env variable: MESSAGE=${MESSAGE}\n` +
    `${new Date().toISOString()}: ${randomString}\n` +
    `Ping / Pongs: ${pingCount}`
  );
});

server.listen(PORT, () => {
  console.log(`Reader server started in port ${PORT}`);
});
