class SessionManager {
  constructor() {
    this.sessionData = {};
  }

  startSessionTimeout(number, callback) {
    this.sessionData[number].timeout = setTimeout(() => {
      delete this.sessionData[number];
      callback(number);
    }, 2 * 60 * 1000); // 2 minutes
  }

  clearTimeoutSessionTimeout(number) {
    if (this.sessionData[number] && this.sessionData[number].timeout) {
      clearTimeout(this.sessionData[number].timeout);
    }
  }
}

module.exports = SessionManager;
