import RTDSClient from './rtds-client';
import client from './client';
import { useDataCreation, useDataUpdate, useDataRead, useLoginStatus } from  './hooks';

export { client, RTDSClient, useDataCreation, useDataUpdate, useDataRead, useLoginStatus };
export default RTDSClient;
