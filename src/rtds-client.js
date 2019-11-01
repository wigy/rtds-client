import socketIOClient from 'socket.io-client';

// If set to true, show all received messages.
const SOCKET_DEBUGGING = false;

/**
 * Socket communication handler.
 */
class RTDSClient {
  constructor(url) {
    this.url = url;
    this.socket = socketIOClient(url);
    this.listeners = {};
    this.on('failure', (data) => this.onFailure(data));
  }

  /**
   * Establish a handler for a message type.
   * @param {String} type
   */
  on(type, callback) {
    if (SOCKET_DEBUGGING) {
      console.log('Socket: listening', type);
    }
    this.socket.on(type, (data) => {
      if (SOCKET_DEBUGGING) {
        console.log('Socket:', type, data);
      }
      callback(data);
    });
  }

  /**
   * Error handler hook.
   * @param {Object} data
   */
  onFailure(data) {
    if (data.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
    }
    console.error(data);
  }

  /**
   * Send a message to the socket server.
   * @param {String} type
   * @param {Object} data
   */
  send(type, data) {
    data = data || {};
    const token = localStorage.getItem('token');
    if (token) {
      data.token = token;
    }
    this.socket.send(type, data);
  }

  /**
   * Add listener for the given message type.
   * @param {String} type
   * @param {Function} callback
   */
  listen(type, callback) {
    if (!this.listeners[type]) {
      this.listeners[type] = [callback];
      this.on(type, (data) => {
        this.listeners[type].forEach(fn => fn(data));
      });
    } else {
      this.listeners[type].push(callback);
    }
  }

  /**
   * Remove the listener for the message type.
   * @param {String} type
   * @param {Function} callback
   */
  unlisten(type, callback) {
    this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
  }

  /**
   * Check if the user is logged in.
   */
  isLoggedIn() {
    return !localStorage.getItem('token');
  }

  /**
   * Try login.
   * @param {Object}
   * @returns {Promise}
   */
  async login({user, password}) {
    // TODO: Extract this useful pattern that can be used elsewhere.
    return new Promise((resolve, reject) => {
      const success = (data) => {
        this.unlisten('login-failed', fail);
        this.unlisten('login-successful', success);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.setItem('token', data.token);
        resolve(data);
      }
      const fail = (err) => {
        this.unlisten('login-failed', fail);
        this.unlisten('login-successful', success);
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        reject(new Error(err.message));
      }

      this.listen('login-failed', fail);
      this.listen('login-successful', success);
      this.send('login', {user, password});
    });
  }
}

export default RTDSClient;
