const { connect, StringCodec } = require("nats");

const NATS_URL =
  process.env.NATS_URL || "nats://my-nats.nats.svc.cluster.local:4222";

const SUBJECT =
  process.env.NATS_SUBJECT || "todo.events";

const WEBHOOK_URL = process.env.WEBHOOK_URL;

const sc = StringCodec();

const start = async () => {
  console.log(`Connecting to NATS at ${NATS_URL}`);

  const nc = await connect({
    servers: NATS_URL,
  });

  console.log("Connected to NATS");

  // Queue subscription ensures that if multiple broadcaster
  // replicas are running, only one receives each message.
  const subscription = nc.subscribe(SUBJECT, {
    queue: "broadcasters",
  });

  console.log(`Listening for '${SUBJECT}' messages`);

  for await (const message of subscription) {
    try {
      const data = JSON.parse(sc.decode(message.data));

      console.log("Received todo event:", data);

      // Production:
      // WEBHOOK_URL is defined, so forward the message.
      //
      // Staging:
      // WEBHOOK_URL is not defined, so only log the message.
      if (WEBHOOK_URL) {
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
      } else {
        console.log("Staging mode: message logged only");
      }
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
