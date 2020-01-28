import socketIOClient from 'socket.io-client';
import deepEqual from 'deep-equal';
import clone from 'clone';

// If set to true, show all received messages.
const SOCKET_DEBUGGING = false;

/**
 * Socket communication handler.
 */
class RTDSClient {
  constructor(url = null) {
    this.url = url;
    if (url !== null) {
      this.init();
    }
  }

  /**
   * Initialize socket and handlers.
   */
  init() {
    this.socket = socketIOClient(this.url);
    this.listeners = {};
    this.on('reconnect', () => this.onReconnect());
    this.on('failure', (data) => this.onFailure(data));
    this.subscriptions = [];
  }

  /**
   * Check if client has been initialized and throw an error if not.
   */
  checkInit() {
    if (this.url === null) {
      throw new Error('Cannot use RTDS client before it has been configured.');
    }
  }

  /**
   * Configure the client.
   * @param {Number} [param0.port]
   * @param {String} [param0.url]
   */
  configure({ port, url }) {
    if (url) {
      this.url = url;
    } else {
      const loc = document.location;
      const url = `${loc.protocol}//${loc.hostname}:${port}`;
      this.url = url;
    }
    this.init();
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
    this.checkInit();
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
    this.checkInit();
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
    this.checkInit();
    data = data || {};
    if (type === 'subscribe-channel') {
      this.subscribe(data);
    } else if (type === 'unsubscribe-channel') {
      this.unsubscribe(data);
    }
    const token = localStorage.getItem('token');
    if (token) {
      this.socket.send(type, {...data, token});
    } else {
      this.socket.send(type, data);
    }
  }

  /**
   * Add listener for the given message type.
   * @param {String} type
   * @param {Function} callback
   */
  listen(type, callback) {
    this.checkInit();
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
    this.checkInit();
    this.listeners[type] = this.listeners[type].filter(cb => cb !== callback);
  }

  /**
   * Check if the user is logged in.
   */
  isLoggedIn() {
    return !!localStorage.getItem('token');
  }

  /**
   * Helper to send a message and then response either successfully or failing.
   * @param {String} param0.channel
   * @param {Object} param0.data
   * @param {String} param1.successChannel
   * @param {Function} param1.successCallback
   * @param {String} param1.failChannel
   * @return {Promise}
   */
  async try({channel, data}, {successChannel, successCallback, failChannel}) {
    return new Promise((resolve, reject) => {
      const success = (data) => {
        this.unlisten(failChannel, fail);
        this.unlisten(successChannel, success);
        successCallback(data);
        resolve(data);
      }
      const fail = (err) => {
        this.unlisten(failChannel, fail);
        this.unlisten(successChannel, success);
        reject(new Error(err.message));
      }

      this.listen(failChannel, fail);
      this.listen(successChannel, success);
      this.send(channel, data);
    });
  }

  /**
   * Try login.
   * @param {Object}
   * @returns {Promise}
   */
  async login({user, password}) {
    return this.try({
        channel: 'login',
        data: {user, password}
      }, {
        successChannel: 'login-successful',
        successCallback: (data) => {
          localStorage.setItem('user', JSON.stringify(data.user));
          localStorage.setItem('token', data.token);
        },
        failChannel: 'login-failed'
    })
    .catch((err) => {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      throw err;
    });
  }

  /**
   * Log out.
   */
  async logout() {
    if (this.isLoggedIn()) {
      await this.try({
        channel: 'logout'
      }, {
        successChannel: 'logout-successful',
        successCallback: () => {
          for (const sub of this.subscriptions) {
            this.unsubscribe(sub);
          }
          localStorage.removeItem('token');
          this.listeners = {};
        }
      });
    }
  }
}

export default RTDSClient;
