import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import type { FileStorage } from "./file-storage.js";

const UUID_PATTERN = /^[0-9a-f-]{36}$/;

export function createLocalStorage(directory: string): FileStorage {
  function pathFor(key: string): string {
    // Only accept keys we generated, which rules out path traversal.
    if (!UUID_PATTERN.test(key)) {
      throw new Error(`Invalid storage key: ${key}`);
    }
    return path.join(directory, key);
  }

  return {
    async save({ buffer }) {
      await mkdir(directory, { recursive: true });
      const key = randomUUID();
      await writeFile(pathFor(key), buffer);
      return key;
    },
    read: (key) => readFile(pathFor(key)),
    async delete(key) {
      await rm(pathFor(key), { force: true });
    },
  };
}
