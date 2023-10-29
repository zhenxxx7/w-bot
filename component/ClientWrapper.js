const { Client, LocalAuth } = require("whatsapp-web.js");
const qrTerminal = require("qrcode-terminal");

class ClientWrapper {
  constructor() {
    this.client = new Client({
      authStrategy: new LocalAuth(),
      // Other client configuration options
    });
    this.client.on("qr", this.handleQRCode);
    this.client.on("authenticated", this.handleAuthenticated);
    // Add other event handlers here
  }

  initialize() {
    this.client.initialize();
  }

  handleQRCode(qr) {
    console.log("QR RECEIVED");
    qrTerminal.generate(qr, { small: true });
  }

  handleAuthenticated() {
    console.log("AUTHENTICATED");
  }

  // Add other event handling methods

  // Expose the client for other components to use
  getClient() {
    return this.client;
  }
}

module.exports = ClientWrapper;
