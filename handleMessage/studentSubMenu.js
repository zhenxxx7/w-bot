const axios = require("axios");
const endpoint = process.env.ENDPOINT;

async function handleStudentSubMenu(msg, userData) {
  const userResponse = msg.body;

  if (userResponse === "1") {
    msg.reply("Anda memilih: View IPK dan IPS.");
    const semesterEndpoint = endpoint + "/semesters";
    const GPAEndpoint = endpoint + "/functions/GPA/" + userData.userId;

    try {
      // Ambil data dari endpoint /semester
      const semesterResponse = await axios.get(semesterEndpoint);
      const semesterData = semesterResponse.data;

      if (semesterData.length === 0) {
        msg.reply("Data semester tidak ditemukan.");
        return;
      }

      // Filter semesters that match the user ID
      const userSemesters = semesterData.filter(
        (semester) => semester.userId === userData.userId
      );

      if (userSemesters.length === 0) {
        msg.reply("Tidak ada semester yang sesuai dengan pengguna saat ini.");
        return;
      }

      // Use a set to store unique semester-year combinations
      const uniqueSemesters = new Set();

      // Initialize a string to store semester information
      let semesterMessages = "";

      // Iterate through semesters for the user
      for (const semester of userSemesters) {
        const semesterYear = semester.semesterYear;
        const semesterNumber = semester.semesterNumber;

        // Check if the combination of semester and year is unique
        const uniqueKey = `${semesterNumber} Tahun ${semesterYear}`;
        if (!uniqueSemesters.has(uniqueKey)) {
          // Buat URL untuk /functions/cumulativeGPA dengan semesterYear dan semesterNumber
          const cumulativeGPAEndpoint =
            endpoint +
            `/functions/cumulativeGPA?userId=${userData.userId}&semesterYear=${semesterYear}&semesterNumber=${semesterNumber}`;

          // Ambil data IPS for the current semester
          const IPSResponse = await axios.get(cumulativeGPAEndpoint);
          const IPSData = IPSResponse.data;

          // Buat pesan yang mencakup data semester dan IPS
          const semesterMessage = `Semester: ${semesterNumber} Tahun ${semesterYear}\nIPS: ${IPSData.toFixed(
            2
          )}`;
          semesterMessages += semesterMessage + "\n\n";

          // Add the unique combination to the set
          uniqueSemesters.add(uniqueKey);
        }
      }

      // Fetch and include the IPK (Cumulative GPA) in the response
      const GPAResponse = await axios.get(GPAEndpoint);
      const GPAData = GPAResponse.data;

      // Combine semester information and IPK into a single response message
      const responseMessage = `Data Semester dan IPS:\n\n${semesterMessages}\nIPK: ${GPAData.toFixed(
        2
      )}`;
      msg.reply(responseMessage);
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

      // Filter grades for the specific user
      const nilai = gradesData.filter(
        (grade) => grade.userId === userData.userId
      );

      if (nilai.length > 0) {
        const nilaiMessage = nilai.map((grade) => {
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

module.exports = { handleStudentSubMenu };
