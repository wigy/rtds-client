import { useEffect } from 'react';
import client from './client';

/**
 * Start listening changes in the given data target.
 * @param {String} target
 * @param {Function} callback
 */
function useDataSync(target, callback) {
  useEffect(() => {
    // TODO: Extract login elsewhere.
    client.send('login', {user: 'tommi.ronkainen@gmail.com', password: 'pass'});
    client.listen(target, callback);
    client.send('subscribe', { target });
    return () => {
      client.unlisten(target, callback);
    }
  }, []);
}

export {
  useDataSync
};
