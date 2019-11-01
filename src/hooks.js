import { useEffect } from 'react';
import client from './client';

/**
 * Start listening changes in the given data channel.
 * @param {String} channel
 * @param {Object} filter
 * @param {Function} callback
 */
function useDataSync(channel, filter, callback = null) {
  let msg;
  if (callback === null) {
    callback = filter;
    msg = { channel };
  } else {
    msg = { channel, filter };
  }
  useEffect(() => {
    client.listen(channel, (data) => {
      console.log('Got', data);
      callback(data);
    });
    client.send('subscribe', msg);
    return () => {
      client.send('unsubscribe', msg);
      client.unlisten(channel, callback);
    }
  }, []);
}

/**
 * Check if the user is logged in.
 */
function useLoginStatus() {
  return !client.isLoggedIn();
}

/**
 * Return a function for creating new objects on the server.
 */
function useDataCreation() {
  return (data) => {
    client.send('create-objects', data);
  };
}

export {
  useDataCreation,
  useDataSync,
  useLoginStatus
};
