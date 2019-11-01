import RTDSClient from './rtds-client';
import client from './client';
import { useDataCreation, useDataSync, useLoginStatus } from  './hooks';

export { client, RTDSClient, useDataCreation, useDataSync, useLoginStatus };
export default RTDSClient;
