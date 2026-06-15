const crypto = require("crypto");

const randomString = crypto.randomUUID();

setInterval(() => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp}: ${randomString}`);
}, 5000);