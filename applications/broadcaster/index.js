const { connect, StringCodec } = require("nats");

const NATS_URL =
  process.env.NATS_URL || "nats://my-nats.nats.svc.cluster.local:4222";

const SUBJECT =
  process.env.NATS_SUBJECT || "todo.events";

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const sc = StringCodec();

const start = async () => {
  if (!WEBHOOK_URL) {
    console.error("WEBHOOK_URL environment variable is required");
    process.exit(1);
  }

  console.log(`Connecting to NATS at ${NATS_URL}`);

  const nc = await connect({
    servers: NATS_URL,
  });

  console.log("Connected to NATS");

  // Queue subscription is important:
  // even with multiple broadcaster replicas,
  // only one replica receives each message.
  const subscription = nc.subscribe(SUBJECT, {
    queue: "broadcasters",
  });

  console.log(
    `Listening for '${SUBJECT}' messages`
  );

  for await (const message of subscription) {
    try {
      const data = JSON.parse(sc.decode(message.data));

      console.log("Received todo event:", data);

      const payload = {
        user: "bot",
        message: data.message,
      };

      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(
          `External service returned ${response.status}`
        );
      }

      console.log("Message forwarded successfully");
    } catch (error) {
      console.error(
        "Failed to process message:",
        error.message
      );
    }
  }
};

start().catch((error) => {
  console.error("Broadcaster failed:", error);
  process.exit(1);
});
