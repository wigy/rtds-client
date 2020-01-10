import socketIOClient from 'socket.io-client';
import deepEqual from 'deep-equal';
import clone from 'clone';

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
    this.on('reconnect', () => this.onReconnect());
    this.on('failure', (data) => this.onFailure(data));
    this.subscriptions = [];
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
        console.log('Socket received:', type, data);
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
   * Subscribe back to all subscriptions.
   */
  onReconnect() {
    this.subscriptions.forEach(s => {
      this.send('subscribe-channel', s);
    });
  }

  /**
   * Find the index of the subscription if it exist, -1 otherwise.
   * @param {String} param0.filter
   * @param {String} param0.channel
   */
  indexOf({filter, channel}) {
    return this.subscriptions.findIndex(s => deepEqual(s, {filter, channel}));
  }

  /**
   * Mark subscription to the channel.
   * @param {String} param0.filter
   * @param {String} param0.channel
   */
  subscribe({filter, channel}) {
    // TODO: Fix double subscription. Where `token` comes from into subscription object?
    if (this.indexOf({filter, channel}) < 0) {
      this.subscriptions.push(clone({filter, channel}));
      if (SOCKET_DEBUGGING) {
        console.log('Subscribe:', channel, filter || null);
      }
    }
  }

  /**
   * Mark un-subscription from the channel.
   * @param {String} param0.filter
   * @param {String} param0.channel
   */
  unsubscribe({filter, channel}) {
    const idx = this.indexOf({filter, channel});
    if (idx >= 0) {
      this.subscriptions = this.subscriptions.splice(idx, 1);
      if (SOCKET_DEBUGGING) {
        console.log('Unubscribe:', channel, filter || null);
      }
    }
  }

  /**
   * Send a message to the socket server.
   * @param {String} type
   * @param {Object} data
   */
  send(type, data) {
    data = data || {};
    if (type === 'subscribe-channel') {
      this.subscribe(data);
    } else if (type === 'unsubscribe-channel') {
      this.unsubscribe(data);
    }
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
