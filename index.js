const {
  Client,
  Location,
  List,
  Buttons,
  LocalAuth,
} = require("whatsapp-web.js");
const qrTerminal = require("qrcode-terminal");
require("dotenv").config();

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

// const welcomedUsers = [];
const sessionData = {};
const axios = require("axios");
const endpoint = process.env.ENDPOINT;

client.on("message", async (msg) => {
  const number = msg.from;
  // console.log(number);

  // welcome message
  if (!sessionData[number]) {
    msg.reply(`Selamat datang! \nSilahkan input NIM/NIP Anda :`);
    sessionData[number] = { userId: null, verified: false };
    startSessionTimeout(number);
    return;
  }

  // verify user
  const session = sessionData[number];
  if (!session.verified) {
    if (msg.body) {
      session.userId = msg.body;
      session.verified = true;
      session.getNumber = (msg.from.match(/\d+/g) || []).join("");
      // console.log(session.getNumber);

      try {
        const response = await axios.post(endpoint + "/verify", {
          userId: session.userId,
          phone: session.getNumber,
        });

        if (response.status === 200) {
          try {
            const response = await axios.get(endpoint + "/users");
            const data = response.data;
            const userData = data.find(
              (user) => user.userId === session.userId
            );

            if (userData.role === "student") {
              msg.reply(
                "Selamat datang, " +
                  userData.name +
                  "!\nSilahkan pilih menu yang tersedia." +
                  "\n\nMenu : \n1. View IPK dan IPS\n2. View Kehadiran Mahasiswa\n3. View Nilai Matakuliah"
              );
            } else if (userData.role === "lecturer") {
              msg.reply(
                "Selamat datang, " +
                  userData.name +
                  "!\nSilahkan pilih menu yang tersedia." +
                  "\n\nMenu : \n1. View Kehadiran Mahasiswa\n2. View Kehadiran Dosen"
              );
            } else {
              msg.reply(`Data Anda tidak ditemukan!`);
            }
          } catch (error) {
            msg.reply("Maaf, terjadi kesalahan saat mengambil data dari URL.");
          }
        } else {
          msg.reply(`Data Anda tidak ditemukan!`);
        }
      } catch (error) {
        msg.reply(`Terjadi kesalahan dalam verifikasi: ${error.message}`);
      }
      return;
    }
  }

  // Handle submenu
  if (session.verified) {
    try {
      const response = await axios.get(endpoint + "/users");
      const data = response.data;
      const userData = data.find((user) => user.userId === session.userId);

      if (userData.role === "student") {
        handleStudentSubMenu(msg, userData);
      } else if (userData.role === "lecturer") {
        handleLecturerSubMenu(msg, userData);
      } else {
        msg.reply(`Data Anda tidak ditemukan!`);
      }
    } catch (error) {
      msg.reply("Maaf, terjadi kesalahan saat mengambil data dari URL.");
    }
  }

  // function for handle student submenu
  async function handleStudentSubMenu(msg, userData) {
    const userResponse = msg.body;

    if (userResponse === "1") {
      msg.reply(
        "Anda memilih: View IPK dan IPS. Menampilkan IPK dan IPS Anda."
      );
      // Implementasikan logika untuk menampilkan IPK dan IPS di sini
    } else if (userResponse === "2") {
      msg.reply(
        "Anda memilih: View Kehadiran Mahasiswa. Menampilkan kehadiran Anda."
      );
      try {
        const attendanceResponse = await axios.get(endpoint + "/absents");
        const classesResponse = await axios.get(endpoint + "/classes");
        const attendanceData = attendanceResponse.data;
        const classesData = classesResponse.data;
        const kehadiran = attendanceData.filter(
          (absent) => absent.userId === userData.userId
        );

        if (kehadiran.length > 0) {
          const kehadiranMessage = kehadiran.map((absent) => {
            const kelas = classesData.find(
              (kelas) => kelas.classId === absent.classId
            );
            return `Kelas: ${kelas.className}, Kehadiran: ${absent.absent}`;
          });

          msg.reply(
            "Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n")
          );
        } else {
          msg.reply("Data kehadiran tidak ditemukan.");
        }
      } catch (error) {
        msg.reply(
          "Maaf, terjadi kesalahan saat mengambil data Kehadiran dari URL."
        );
      }
    } else if (userResponse === "3") {
      msg.reply(
        "Anda memilih: View Nilai Matakuliah. Menampilkan nilai matakuliah Anda."
      );
      try {
        const gradesResponse = await axios.get(endpoint + "/grades");
        const classesResponse = await axios.get(endpoint + "/classes");
        const gradesData = gradesResponse.data;
        const classesData = classesResponse.data;
        const nilai = gradesData.find(
          (grade) => grade.userId === userData.userId
        );

        if (nilai) {
          const kelas = classesData.find(
            (kelas) => kelas.classId === nilai.classId
          );
          if (kelas) {
            const replyMessage = `Nilai matakuliah Anda adalah sebagai berikut:\n\nMatakuliah: ${kelas.className}\nNilai: ${nilai.grade}`;
            msg.reply(replyMessage);
          } else {
            msg.reply("Data kelas tidak ditemukan.");
          }
        } else {
          msg.reply("Data nilai tidak ditemukan.");
        }
      } catch (error) {
        msg.reply("Maaf, terjadi kesalahan saat mengambil data dari URL.");
      }
    } else {
      msg.reply("Pilihan tidak valid. Silahkan pilih menu yang tersedia.");
    }
  }

  // function for handle lecturer submenu
  async function handleLecturerSubMenu(msg, userData) {
    const userResponse = msg.body;

    if (userResponse === "1") {
      msg.reply(
        "Anda memilih: View Kehadiran Mahasiswa. Menampilkan kehadiran mahasiswa Anda."
      );
      // Implementasikan logika untuk menampilkan kehadiran mahasiswa di sini
    } else if (userResponse === "2") {
      msg.reply(
        "Anda memilih: View Kehadiran Dosen. Menampilkan kehadiran Anda sebagai dosen."
      );
      // Implementasikan logika untuk menampilkan kehadiran dosen di sini
    } else {
      msg.reply("Pilihan tidak valid. Silahkan pilih menu yang tersedia.");
    }
  }

  // Add more options and handling for other menu items as needed.
  if (msg.body === ">send message") {
    msg.reply(
      `Enter the number and message with format : \n>sendto 628xxxxx Hello World`
    );
  } else if (msg.body.startsWith(">sendto ")) {
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
  } else if (msg.body === "test") {
    try {
      const response = await axios.get(endpoint + "/users");
      const data = response.data;

      msg.reply(`Data dari URL:\n${JSON.stringify(data, null, 2)}`);
    } catch (error) {
      msg.reply("Maaf, terjadi kesalahan saat mengambil data dari URL.");
    }
  }

  // Handle session timeout
  function startSessionTimeout(number) {
    sessionData[number].timeout = setTimeout(() => {
      delete sessionData[number];
      client.sendMessage(
        number,
        "Sesi berakhir karena tidak ada aktivitas. Silakan mulai sesi lagi."
      );
    }, 2 * 60 * 1000); // 2 menit
  }

  // Fuction for clear session timeout
  function clearTimeoutSessionTimeout(number) {
    if (sessionData[number] && sessionData[number].timeout) {
      clearTimeout(sessionData[number].timeout);
    }
  }
});
