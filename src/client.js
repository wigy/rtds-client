import RTDSClient from './rtds-client';

let client;
if (!client) {
  // TODO: Handle port config.
  const config = {
    SERVER_PORT: 3201
  }
  const loc = document.location;
  const url = `${loc.protocol}//${loc.hostname}:${config.SERVER_PORT}`;
  client = new RTDSClient(url);
}

export default client;
