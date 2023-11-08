const client = require("./components/client");
const { handleMessage } = require("./components/messageHandler");

client.on("message", async (msg) => {
  handleMessage(msg);
});
