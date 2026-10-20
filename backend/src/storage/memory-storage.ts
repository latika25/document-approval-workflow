import { randomUUID } from "node:crypto";
import type { FileStorage } from "./file-storage.js";

export function createMemoryStorage(): FileStorage & { size(): number } {
  const files = new Map<string, Buffer>();

  return {
    async save({ buffer }) {
      const key = randomUUID();
      files.set(key, Buffer.from(buffer));
      return key;
    },
    async read(key) {
      const file = files.get(key);
      if (!file) throw new Error(`File not found: ${key}`);
      return file;
    },
    async delete(key) {
      files.delete(key);
    },
    size: () => files.size,
  };
}
