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
