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
    msg.reply(`Selamat datang! \nSilahkan input NIM/NIDN Anda :`);
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
        handleStudentSubMenu(msg, userData);
      } else if (userData.role === "Lecturer" || userData.role === "lecturer") {
        handleLecturerSubMenu(msg, userData);
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

  // function for handle student submenu
  async function handleStudentSubMenu(msg, userData) {
    const userResponse = msg.body;

    if (userResponse === "1") {
      msg.reply("Anda memilih: View IPK dan IPS.");
      const semesterEndpoint = endpoint + "/semesters";
      const GPAEndpoint = endpoint + "/functions/GPA/" + userData.userId;
      console.log(semesterEndpoint);

      try {
        // Ambil data dari endpoint /semester
        const semesterResponse = await axios.get(semesterEndpoint);
        const semesterData = semesterResponse.data;

        // show semesters data in console

        // Ambil semesterYear dan semesterNumber dari data /semester
        const firstSemester = semesterData[0];
        const semesterYear = firstSemester.semesterYear;
        const semesterNumber = firstSemester.semesterNumber;

        // Buat URL untuk /functions/cumulativeGPA dengan semesterYear dan semesterNumber
        const cumulativeGPAEndpoint =
          endpoint +
          `/functions/cumulativeGPA?userId=${userData.userId}&semesterYear=${semesterYear}&semesterNumber=${semesterNumber}`;

        // Ambil data GPA dan IPS
        const GPAResponse = await axios.get(GPAEndpoint);
        const GPAData = GPAResponse.data;
        const IPSResponse = await axios.get(cumulativeGPAEndpoint);
        const IPSData = IPSResponse.data;

        // Buat pesan yang mencakup data semester, IPK, dan IPS
        const semesterMessage = `Semester: ${firstSemester.semesterNumber} Tahun ${firstSemester.semesterYear}\nIPS: ${IPSData}\n`;
        const message = `Data IPK dan IPS:\n\n${semesterMessage}\nIPK: ${GPAData.toFixed(
          2
        )}`;

        msg.reply(message);
      } catch (error) {
        msg.reply("Maaf, terjadi kesalahan saat mengambil data dari URL.");
      }
    } else if (userResponse === "2") {
      msg.reply("Anda memilih: View Kehadiran Mahasiswa.");
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
            const messageBold = `*${kelas.className}*`;
            return `Kelas: ${messageBold}\nTanggal: ${absent.date}\nKeterangan: ${absent.absent}\n`;
          });

          msg.reply(
            "Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n")
          );
        } else {
          msg.reply("Mantaap, Anda tidak absen!");
        }
      } catch (error) {
        msg.reply(
          "Maaf, terjadi kesalahan saat mengambil data Kehadiran dari URL."
        );
      }
    } else if (userResponse === "3") {
      msg.reply("Anda memilih: View Nilai Matakuliah.");
      try {
        const gradesResponse = await axios.get(endpoint + "/grades");
        const classesResponse = await axios.get(endpoint + "/classes");
        const gradesData = gradesResponse.data;
        const classesData = classesResponse.data;
        const nilai = gradesData.find(
          (grade) => grade.userId === userData.userId
        );

        if (nilai) {
          const nilaiMessage = gradesData.map((grade) => {
            const kelas = classesData.find(
              (kelas) => kelas.classId === grade.classId
            );
            const messageBold = `*${kelas.className}*`;
            return `Matakuliah: ${messageBold}\nNilai: ${grade.grade}\n`;
          });

          msg.reply("Data Nilai Matakuliah:\n" + nilaiMessage.join("\n"));
        } else {
          msg.reply("Mantaap, Anda tidak ada nilai!");
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
      msg.reply("Menantikan data kehadiran mahasiswa.");
      try {
        // cek kelas yang diajar jika userId sama dengan teacherId di /classes
        const classesResponse = await axios.get(endpoint + "/classes");
        const classesData = classesResponse.data;
        const kelas = classesData.filter(
          (kelas) => kelas.teacherId === userData.userId
        );
        // cek kehadiran mahasiswa yang late dan absent jika classId sama dengan classId di /absents
        const attendanceResponse = await axios.get(endpoint + "/absents");
        const attendanceData = attendanceResponse.data;
        const kehadiran = attendanceData.filter(
          (absent) => absent.classId === kelas[0].classId
        );

        console.log(kelas);
        console.log(kehadiran);

        // munculkan nama kelas hanya muncul sekali dan jika ada dua kelas maka munculkan dua kelas namun hanya muncul sekali
        if (kehadiran.length > 0) {
          const kehadiranMessage = kehadiran.map((absent) => {
            const messageBold = `*${kelas[0].className}*`;
            return `Kelas: ${messageBold}\nTanggal: ${absent.date}\nKeterangan: ${absent.absent}\n`;
          });

          msg.reply(
            "Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n")
          );
        } else {
          msg.reply(
            "Mantaap, Anda tidak memiliki mahasiswa yang absen di kelas Anda!"
          );
        }
      } catch (error) {
        msg.reply(
          "Maaf, terjadi kesalahan saat mengambil data Kehadiran dari URL."
        );
      }
    } else if (userResponse === "2") {
      msg.reply("Menampilkan kehadiran Anda sebagai dosen.");
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
            const messageBold = `*${kelas.className}*`;
            return `Kelas: ${messageBold}\nTanggal: ${absent.date}\nKeterangan: ${absent.absent}\n`;
          });

          msg.reply(
            "Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n")
          );
        } else {
          msg.reply("Mantaap, Anda tidak absen!");
        }
      } catch (error) {
        msg.reply(
          "Maaf, terjadi kesalahan saat mengambil data Kehadiran dari URL."
        );
      }
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
