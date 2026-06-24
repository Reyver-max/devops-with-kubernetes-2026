const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const outputPath = "/usr/src/app/files/output.txt";
const pingpongPath = "/usr/src/app/files/pingpong.txt";

const server = http.createServer((req, res) => {
  let output = "No log output yet";
  let pingpong = "0";

  if (fs.existsSync(outputPath)) {
    output = fs.readFileSync(outputPath, "utf8");
  }

  if (fs.existsSync(pingpongPath)) {
    pingpong = fs.readFileSync(pingpongPath, "utf8");
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(`${output}\nPing / Pongs: ${pingpong}`);
});

server.listen(PORT, () => {
  console.log(`Reader server started in port ${PORT}`);
});
