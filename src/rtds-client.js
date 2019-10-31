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
    this.on('welcome', (data) => this.onWelcome(data));
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
   * Store the token and user.
   * @param {Object} data
   */
  onWelcome(data) {
    localStorage.setItem('user', JSON.stringify(data.user));
    localStorage.setItem('token', data.token);
  }

  /**
   * Error handler hook.
   * @param {Object} data
   */
  onFailure(data) {
    if (data.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      console.log('TODO: Redirect to login using hook or something.');
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
}

export default RTDSClient;
