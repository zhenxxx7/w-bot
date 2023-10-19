const {
  Client,
  Location,
  List,
  Buttons,
  LocalAuth,
} = require("whatsapp-web.js");
const qrTerminal = require("qrcode-terminal");

const client = new Client({
  authStrategy: new LocalAuth(),
  // proxyAuthentication: { username: 'username', password: 'password' },
  puppeteer: {
    // args: ['--proxy-server=proxy-server-that-requires-authentication.example.com'],
    headless: false,
  },
});

client.initialize();

client.on("loading_screen", (percent, message) => {
  console.log("LOADING SCREEN", percent, message);
});

client.on("qr", (qr) => {
  // NOTE: This event will not be fired if a session is specified.
  console.log("QR RECEIVED");
  qrTerminal.generate(qr, { small: true });
});

client.on("authenticated", () => {
  console.log("AUTHENTICATED");
});

client.on("auth_failure", (msg) => {
  // Fired if session restore was unsuccessful
  console.error("AUTHENTICATION FAILURE", msg);
});

client.on("ready", () => {
  console.log("READY");
});

client.on("message", async (msg) => {
  const number = msg.from;
  //console.log(number)

  if (msg.body === "Menu" || msg.body === "menu" || msg.body === "MENU") {
    msg.reply(`Menu : \n/student\n/teacher`);
  }

  if (msg.body === "/student") {
    msg.reply(
      `Menu Mahasiswa: \n/IPK\n/IPS\n/Kehadiran Mahasiswa\n/Nilai Matakuliah`
    );
  }

  if (msg.body === "/teacher") {
    msg.reply(`Menu Guru: \n/Kehadiran Mahasiswa\n/Kehadiran Dosen`);
  }

  if (msg.body === "/IPK") {
    msg.reply(`Menu IPK Mahasiswa: \n/View IPK\n/Calculate IPK\n/Update IPK`);
  }

  if (msg.body === "/IPS") {
    msg.reply(`Menu IPS Mahasiswa: \n/View IPS\n/Calculate IPS\n/Update IPS`);
  }

  if (msg.body === "/Kehadiran Mahasiswa") {
    msg.reply(
      `Menu Kehadiran Mahasiswa: \n/View Kehadiran\n/Mark Kehadiran\n/Update Kehadiran`
    );
  }

  if (msg.body === "/Nilai Matakuliah") {
    msg.reply(
      `Menu Nilai Matakuliah: \n/View Grades\n/Submit Assignment\n/View Assignment Progress`
    );
  }

  if (msg.body === "/Kehadiran Dosen") {
    msg.reply(
      `Menu Kehadiran Dosen: \n/View Kehadiran\n/Mark Kehadiran\n/Update Kehadiran`
    );
  }

  // Add more options and handling for other menu items as needed.

  if (msg.body === ">send message") {
    msg.reply(
      `Enter the number and message with format : \n>sendto 628xxxxx Hello World`
    );
  }

  if (msg.body.startsWith(">sendto ")) {
    const messageParts = msg.body.split(" ");
    if (messageParts.length >= 3) {
      const targetNumber = messageParts[1];
      const customMessage = messageParts.slice(2).join(" ");
      msg.reply(
        `Message has been send to ${targetNumber}with ${customMessage}`
      );
    } else {
      msg.reply(
        "Format pesan tidak valid. Silakan gunakan format: /kirimpesan [NomorTujuan] [Pesan]"
      );
    }
  }
});
