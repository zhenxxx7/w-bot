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

        msg.reply("Data Kehadiran Mahasiswa:\n" + kehadiranMessage.join("\n"));
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
