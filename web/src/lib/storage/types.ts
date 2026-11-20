export interface StoredFile {
  url: string;
  key: string;
  driver: string;
}

export interface StorageDriver {
  name: string;
  put(key: string, data: Buffer, contentType: string): Promise<StoredFile>;
  delete(key: string): Promise<void>;
}
