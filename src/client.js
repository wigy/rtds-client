import RTDSClient from './rtds-client';

let client;
if (!client) {
  client = new RTDSClient();
}

export default client;
