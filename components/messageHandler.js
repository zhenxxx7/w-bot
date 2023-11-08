const axios = require("axios");
const {
  startSessionTimeout,
  clearTimeoutSessionTimeout,
  sessionData,
} = require("./sessionTimeout");
const endpoint = process.env.ENDPOINT;

const { handleStudentSubMenu } = require("../handleMessage/studentSubMenu");
const { handleLecturerSubMenu } = require("../handleMessage/lecturerSubMenu");

const client = require("./client");

async function handleMessage(msg) {
  const number = msg.from;

  // welcome message
  if (!sessionData[number] && /^(menu|Menu|MENU)$/.test(msg.body)) {
    msg.reply(`Selamat datang! \nSilahkan input NIM/NIDN Anda :`);
    sessionData[number] = { userId: null, verified: false };
    startSessionTimeout(number);
    return;
  }

  // verify user
  if (sessionData[number]) {
    const session = sessionData[number];
    if (!session.verified) {
      if (msg.body) {
        session.userId = msg.body;
        session.verified = true;
        session.getNumber = (msg.from.match(/\d+/g) || []).join("");
        // console.log(session.getNumber);

        try {
          const response = await axios.post(endpoint + "/users/verify", {
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

              if (userData.role === "Student" || userData.role === "student") {
                msg.reply(
                  "Selamat datang, " +
                    userData.name +
                    "!\nSilahkan pilih menu yang tersedia." +
                    "\n\nMenu : \n1. View IPK dan IPS\n2. View Kehadiran Mahasiswa\n3. View Nilai Matakuliah"
                );
              } else if (
                userData.role === "Lecturer" ||
                userData.role === "lecturer"
              ) {
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
              msg.reply("Maaf, terjadi kesalahan. silahkan coba lagi.");
            }
          } else {
            msg.reply(`Data Anda tidak ditemukan!`);
          }
        } catch (error) {
          msg.reply(
            `Terjadi kesalahan dalam verifikasi: ${error.message}\n\nSilahkan memulai sesi lagi.`
          );
          clearTimeoutSessionTimeout(number);
          delete sessionData[number];
          return;
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

        if (userData.role === "Student" || userData.role === "student") {
          handleStudentSubMenu(msg, userData); // Use the student submenu handler
        } else if (
          userData.role === "Lecturer" ||
          userData.role === "lecturer"
        ) {
          handleLecturerSubMenu(msg, userData); // Use the lecturer submenu handler
        } else {
          msg.reply(`Data Anda tidak ditemukan!`);
        }
      } catch (error) {
        msg.reply(
          "Maaf, terjadi kesalahan saat mengambil data silahkan coba lagi."
        );
        return;
      }
    }
  }
}

module.exports = {
  handleMessage,
};
