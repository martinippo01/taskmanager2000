// eslint-disable-next-line @typescript-eslint/no-unused-vars
const supportedMultiCommands = [
  'set',
  'sadd',
  'sIsMember',
  'delete',
  'setWithExpiry',
] as const;

export type RedisMultiCommand = [
  (typeof supportedMultiCommands)[number],
  string,
  string,
];

export interface RedisRepository {
  get(key: string): Promise<string | null>;
  set(key: string, value: string): Promise<void>;
  sadd(key: string, value: string): Promise<void>;
  sIsMember(key: string, value: string): Promise<boolean>;
  delete(key: string): Promise<void>;
  setWithExpiry(key: string, value: string, expiry: number): Promise<void>;
  ping(): Promise<boolean>;
  multi(commands: RedisMultiCommand[]): Promise<void>;
}

export const RedisRepository = Symbol('RedisRepository');
