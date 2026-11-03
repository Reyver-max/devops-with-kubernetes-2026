const http = require("http");

const PORT = process.env.PORT || 3000;
const GREETING = process.env.GREETING || "Hello from greeter!";

const server = http.createServer((req, res) => {
  if (req.method === "GET") {
    res.writeHead(200, {
      "Content-Type": "text/plain",
    });
    res.end(GREETING);
    return;
  }

  res.writeHead(405, {
    "Content-Type": "text/plain",
  });
  res.end("Method not allowed");
});

server.listen(PORT, () => {
  console.log(`Greeter started on port ${PORT}`);
});
