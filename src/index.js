import RTDSClient from './rtds-client';
import client from './client';
import { useDataCreation, useDataRead, useDataUpdate, useDataDelete, useLoginStatus } from  './hooks';

export { client, RTDSClient, useDataCreation, useDataUpdate, useDataRead, useDataDelete, useLoginStatus };
export default RTDSClient;
