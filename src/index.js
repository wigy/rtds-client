import socketIOClient from 'socket.io-client';

// If set to true, show all received messages.
const SOCKET_DEBUGGING = false;

/**
 * Socket communication handler.
 */
class RTDSClient {
  constructor(url) {
    this.socket = socketIOClient(url);

    this.on('welcome', (data) => console.log('Welcome', data));
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
   * Send a message to the socket server.
   * @param {String} type
   * @param {Object} data
   */
  send(type, data) {
    data = data || {};
    // TODO: Handle credentials if logged in.
    this.socket.send(type, data);
  }
}

export default RTDSClient;
