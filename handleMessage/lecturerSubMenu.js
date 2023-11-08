const axios = require("axios");
const endpoint = process.env.ENDPOINT;

async function handleLecturerSubMenu(msg, userData) {
  const userResponse = msg.body;

  if (userResponse === "1") {
    msg.reply("Menampilkan data kehadiran mahasiswa.");
    try {
      // cek kelas yang diajar jika userId sama dengan teacherId di /classes
      const classesResponse = await axios.get(endpoint + "/classes");
      const classesData = classesResponse.data;
      const kelas = classesData.filter(
        (kelas) => kelas.teacherId === userData.userId
      );

      if (kelas.length === 0) {
        msg.reply("Anda tidak mengajar kelas apapun.");
        return; // Tidak ada kelas yang diajar, keluar dari fungsi.
      }

      const kehadiranPromises = kelas.map(async (kelasItem) => {
        const classId = kelasItem.classId;

        // cek kehadiran mahasiswa yang late dan absent jika classId sama dengan classId di /absents
        const attendanceResponse = await axios.get(endpoint + "/absents");
        const attendanceData = attendanceResponse.data;
        const kehadiran = attendanceData.filter(
          (absent) =>
            absent.classId === classId && absent.userId !== userData.userId
        );

        const namaMahasiswaResponse = await axios.get(endpoint + "/users");
        const namaMahasiswa = namaMahasiswaResponse.data;
        // cek jika userId pada /absents sama dengan userId pada /users lalu tarik nim dan nama
        kehadiran.forEach((absent) => {
          const mahasiswa = namaMahasiswa.find(
            (user) => user.userId === absent.userId
          );
          absent.nim = mahasiswa.userId;
          absent.name = mahasiswa.name;
        });

        return {
          className: kelasItem.className,
          kehadiran: kehadiran,
        };
      });

      const kehadiranResults = await Promise.all(kehadiranPromises);

      const kehadiranMessage = kehadiranResults
        .filter((result) => result.kehadiran.length > 0)
        .map((result) => {
          const messageBold = `*${result.className}*`;
          const kehadiran = result.kehadiran
            .map(
              (absent) =>
                `Kelas: ${messageBold}\nTanggal: ${absent.date}\nKeterangan: ${absent.absent}\nNama: ${absent.name}\nNIM: ${absent.nim}\n`
            )
            .join("\n");

          return kehadiran;
        });

      if (kehadiranMessage.length > 0) {
        msg.reply("Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n"));
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

        msg.reply("Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n"));
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

module.exports = { handleLecturerSubMenu };
