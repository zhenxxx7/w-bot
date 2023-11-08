const sessionData = {};
const client = require("./client");

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

module.exports = {
  startSessionTimeout,
  clearTimeoutSessionTimeout,
  sessionData,
};
