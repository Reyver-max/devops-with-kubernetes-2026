const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;
const randomString = crypto.randomUUID();

const getPingCount = async () => {
  try {
    const response = await fetch("http://ping-pong-svc:2345/pings");
    return await response.text();
  } catch (error) {
    console.error("Failed to fetch ping count:", error);
    return "0";
  }
};

const server = http.createServer(async (req, res) => {
  const pingCount = await getPingCount();

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${new Date().toISOString()}: ${randomString}\nPing / Pongs: ${pingCount}`);
});

server.listen(PORT, () => {
  console.log(`Reader server started in port ${PORT}`);
});
