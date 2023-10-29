const { ClientWrapper } = require("./component/ClientWrapper");
const SessionManager = require("./component/SessionManager");
const StudentHandler = require("./component/StudentHandler");
const LecturerHandler = require("./component/LecturerHandler");

const clientWrapper = new ClientWrapper();
const sessionManager = new SessionManager();

const client = clientWrapper.getClient();

client.on("message", async (msg) => {
  const number = msg.from;

  if (sessionManager.isSessionActive(number)) {
    sessionManager.clearTimeoutSessionTimeout(number);
    sessionManager.startSessionTimeout(number, (number) => {
      sessionManager.clearSession(number);
    });
  }

  if (userData.role === "Student" || userData.role === "student") {
    StudentHandler.handleStudentSubMenu(msg);
  } else if (userData.role === "Lecturer" || userData.role === "lecturer") {
    LecturerHandler.handleLecturerSubMenu(msg);
  }
});
