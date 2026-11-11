import { describe, it, expect } from "@jest/globals";
import { loadConfig } from "../config";

describe("loadConfig", () => {
  it("parses the API key and applies defaults", () => {
    const config = loadConfig({ TOGETHER_API_KEY: "test-key" });
    expect(config.TOGETHER_API_KEY).toBe("test-key");
    expect(config.MODEL).toBe("black-forest-labs/FLUX.1-schnell-Free");
    expect(config.TIMEOUT_MS).toBe(30000);
  });

  it("accepts an explicit TIMEOUT_MS", () => {
    const config = loadConfig({
      TOGETHER_API_KEY: "test-key",
      TIMEOUT_MS: "5000",
    });
    expect(config.TIMEOUT_MS).toBe(5000);
  });

  it("throws when TOGETHER_API_KEY is missing", () => {
    expect(() => loadConfig({})).toThrow(
      "Configuration validation failed: TOGETHER_API_KEY: TOGETHER_API_KEY is required",
    );
  });

  it("throws when TIMEOUT_MS is not an integer", () => {
    expect(() =>
      loadConfig({ TOGETHER_API_KEY: "test-key", TIMEOUT_MS: "abc" }),
    ).toThrow("TIMEOUT_MS must be a positive integer");
  });

  it("throws when TIMEOUT_MS is not positive", () => {
    expect(() =>
      loadConfig({ TOGETHER_API_KEY: "test-key", TIMEOUT_MS: "0" }),
    ).toThrow("TIMEOUT_MS must be a positive integer");
  });

  it("defaults to process.env when no env is passed", () => {
    const original = process.env.TOGETHER_API_KEY;
    process.env.TOGETHER_API_KEY = "env-key";
    try {
      const config = loadConfig();
      expect(config.TOGETHER_API_KEY).toBe("env-key");
    } finally {
      if (original === undefined) {
        delete process.env.TOGETHER_API_KEY;
      } else {
        process.env.TOGETHER_API_KEY = original;
      }
    }
  });
});
