import { randomUUID } from "node:crypto";
import { del, get, put } from "@vercel/blob";
import type { FileStorage } from "./file-storage.js";

export function createBlobStorage(): FileStorage {
  return {
    async save({ buffer, mimeType }) {
      const pathname = `submissions/${randomUUID()}`;
      await put(pathname, buffer, {
        access: "private",
        contentType: mimeType,
        addRandomSuffix: false,
      });
      return pathname;
    },

    async read(key) {
      const result = await get(key, { access: "private", useCache: false });
      if (!result || result.statusCode !== 200) {
        throw new Error(`File not found in blob storage: ${key}`);
      }
      return Buffer.from(await new Response(result.stream).arrayBuffer());
    },

    async delete(key) {
      await del(key);
    },
  };
}
