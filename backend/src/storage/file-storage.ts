import type { AppConfig } from "../config.js";
import { createBlobStorage } from "./blob-storage.js";
import { createLocalStorage } from "./local-storage.js";

export interface FileStorage {
  save(file: { buffer: Buffer; mimeType: string }): Promise<string>;
  read(key: string): Promise<Buffer>;
  delete(key: string): Promise<void>;
}

export function createFileStorage(config: AppConfig): FileStorage {
  return config.storageDriver === "blob"
    ? createBlobStorage()
    : createLocalStorage(config.uploadDir);
}
