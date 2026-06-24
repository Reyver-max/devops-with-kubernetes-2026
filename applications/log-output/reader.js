const http = require("http");
const fs = require("fs");

const PORT = process.env.PORT || 3000;
const filePath = "/usr/src/app/files/output.txt";

const server = http.createServer((req, res) => {
  let content = "No content yet";

  if (fs.existsSync(filePath)) {
    content = fs.readFileSync(filePath, "utf8");
  }

  res.writeHead(200, { "Content-Type": "text/plain" });
  res.end(content);
});

server.listen(PORT, () => {
  console.log(`Reader server started in port ${PORT}`);
});
