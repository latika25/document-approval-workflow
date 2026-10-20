import { describe, expect, it } from "vitest";
import { loadConfig } from "./config.js";

describe("configuration", () => {
  it("works with no environment variables for local development", () => {
    const config = loadConfig({});
    expect(config.databaseUrl).toBeUndefined();
    expect(config.storageDriver).toBe("local");
    expect(config.maxUploadBytes).toBe(4 * 1024 * 1024);
    expect(config.rateLimitEnabled).toBe(true);
  });

  it("requires JWT_SECRET in production", () => {
    expect(() => loadConfig({ NODE_ENV: "production" })).toThrow(/JWT_SECRET/);
    expect(loadConfig({ NODE_ENV: "production", JWT_SECRET: "s" }).jwtSecret).toBe("s");
  });

  it("switches to Vercel Blob automatically when its token is present", () => {
    expect(loadConfig({ BLOB_READ_WRITE_TOKEN: "token" }).storageDriver).toBe("blob");
  });

  it("refuses to start on Vercel without a database or file storage", () => {
    expect(() => loadConfig({ VERCEL: "1", BLOB_READ_WRITE_TOKEN: "t" })).toThrow(/DATABASE_URL/);
    expect(() => loadConfig({ VERCEL: "1", DATABASE_URL: "postgres://x" })).toThrow(/Blob/);

    const config = loadConfig({
      VERCEL: "1",
      DATABASE_URL: "postgres://x",
      BLOB_READ_WRITE_TOKEN: "t",
    });
    expect(config.trustProxy).toBe(true);
  });

  it("rejects an unknown storage driver", () => {
    expect(() => loadConfig({ STORAGE_DRIVER: "s3" })).toThrow(/STORAGE_DRIVER/);
  });
});
