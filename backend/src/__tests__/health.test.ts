import { describe, it, expect, beforeAll, afterAll } from "vitest";
import http from "http";
import app from "../app";

let server: http.Server;
let baseUrl = "http://localhost:0";

function fetchUrl(path: string) {
  return fetch(`${baseUrl}${path}`);
}

beforeAll(async () => {
  await new Promise<void>((resolve) => {
    server = app.listen(0, () => resolve());
  });
  const addr = server.address();
  if (addr && typeof addr === "object") {
    baseUrl = `http://localhost:${addr.port}`;
  }
});

afterAll(() => {
  server?.close();
});

describe("health check", () => {
  it("should return ok", async () => {
    const res = await fetchUrl("/health");
    const data = await res.json();
    expect(data).toEqual({ ok: true });
  });
});
