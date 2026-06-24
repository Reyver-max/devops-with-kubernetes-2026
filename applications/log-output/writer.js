const crypto = require("crypto");
const fs = require("fs");

const randomString = crypto.randomUUID();
const filePath = "/usr/src/app/files/output.txt";

const writeStatus = () => {
  const status = `${new Date().toISOString()}: ${randomString}`;
  console.log(status);
  fs.writeFileSync(filePath, status);
};

writeStatus();
setInterval(writeStatus, 5000);

