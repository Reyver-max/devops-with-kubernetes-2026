const http = require("http");
const crypto = require("crypto");

const PORT = process.env.PORT || 3000;

const PING_PONG_HOST =
  process.env.PING_PONG_HOST || "ping-pong-svc";

const PING_PONG_PORT =
  process.env.PING_PONG_PORT || 2345;
const GREETER_HOST = process.env.GREETER_HOST || "greeter-svc";
const GREETER_PORT = process.env.GREETER_PORT || 80;


const randomString = crypto.randomUUID();

const getStatus = () => {
  return `${new Date().toISOString()}: ${randomString}`;
};

setInterval(() => {
  console.log(getStatus());
}, 5000);

/*
 * Test whether Log-output can communicate with Ping-pong.
 */
const checkPingPong = () => {
  return new Promise((resolve, reject) => {
    const request = http.get(
      {
        hostname: PING_PONG_HOST,
        port: PING_PONG_PORT,
        path: "/pings",
        timeout: 2000,
      },
      (response) => {
        if (
          response.statusCode >= 200 &&
          response.statusCode < 300
        ) {
          response.resume();
          resolve();
        } else {
          response.resume();
          reject(
            new Error(
              `Ping-pong returned ${response.statusCode}`
            )
          );
        }
      }
    );

    request.on("error", reject);

    request.on("timeout", () => {
      request.destroy();
      reject(new Error("Ping-pong request timed out"));
    });
  });
};

const getGreeting = () => new Promise((resolve, reject) => {
  http.get(`http://${GREETER_HOST}:${GREETER_PORT}/`, (response) => {
    let data = "";
    response.on("data", chunk => data += chunk);
    response.on("end", () => resolve(data.trim()));
  }).on("error", reject);
});

const server = http.createServer(async (req, res) => {
  if (req.url === "/healthz") {
    try {
      await checkPingPong();

      res.writeHead(200, {
        "Content-Type": "text/plain",
      });

      res.end("OK");
    } catch (error) {
      console.error(
        "Ping-pong is not ready:",
        error.message
      );

      res.writeHead(500, {
        "Content-Type": "text/plain",
      });

      res.end("Ping-pong not ready");
    }

    return;
  }

  res.writeHead(200, {
    "Content-Type": "text/plain",
  });

  try {
    const greeting = await getGreeting();
    res.end(`${getStatus()}\n${greeting}`);
  } catch (error) {
    console.error("Greeter unavailable:", error.message);
    res.end(`${getStatus()}\nGreeter temporarily unavailable`);
  }
});

server.listen(PORT, () => {
  console.log(`Server started in port ${PORT}`);
});
// GitOps deployment test
