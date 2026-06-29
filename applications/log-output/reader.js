const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const outputPath = "/usr/src/app/files/output.txt";

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
  let output = "No log output yet";

  if (fs.existsSync(outputPath)) {
    output = fs.readFileSync(outputPath, "utf8");
  }

  const pingCount = await getPingCount();

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${output}\nPing / Pongs: ${pingCount}`);
});

server.listen(PORT, () => {
  console.log(`Reader server started in port ${PORT}`);
});
