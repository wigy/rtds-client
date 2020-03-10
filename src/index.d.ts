import { Dispatch, SetStateAction } from 'react';

type RequestCallback = Dispatch<SetStateAction<any[]>>;

declare interface RequestParam {
  [key: string]: any
}

declare interface ChannelFilter {
  channel: string,
  filter?: string
}

declare interface Configuration {
  port?: number,
  url?: string
}

declare interface Data {
  [key: string]: any
}

declare interface ChannelData {
  channel: string,
  data: Data
}

declare class RTDSClient {
  url: string;
  socket: any;
  listeners: {};
  subscriptions: any;

  constructor(url?: any);
  init(): void;
  checkInit(): void;
  configure({ port, url }?: Configuration): void;
  on(type: string, callback: any): void;
  onFailure(data: any): void;
  onReconnect(): void;
  indexOf({ filter, channel }: ChannelFilter): any;
  subscribe({ filter, channel }: ChannelFilter): void;
  unsubscribe({ filter, channel }: ChannelFilter): void;
  send(type: string, data: any): void;
  listen(type: string, callback: Function): void;
  unlisten(type: string, callback: Function): void;
  isLoggedIn(): boolean;
  try({ channel, data }: ChannelData, { successChannel, successCallback, failChannel }: any): Promise<any>;
  login({ user, password }: any): Promise<any>;
  logout(): Promise<void>;
}

declare module RTDSClient {
  const client: RTDSClient;
  function useDataRead(channel: string, callback: RequestCallback): void;
  function useDataRead(channel: string, filter: RequestParam, callback: RequestCallback): void;
  function useLoginStatus(): boolean;
  function useDataCreation(): (data: Data) => void;
  function useDataUpdate(): (data: Data) => void;
  function useDataDelete(): (data: Data) => void;
}

export = RTDSClient;
