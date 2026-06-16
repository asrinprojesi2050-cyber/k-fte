import { describe, it, expect } from "vitest";
import { haversineKm } from "../utils/geo";

describe("haversineKm", () => {
  it("returns 0 for same coordinates", () => {
    expect(haversineKm(42.0, 21.43, 42.0, 21.43)).toBe(0);
  });

  it("calculates Skopje to Ohrid distance (~115 km)", () => {
    const dist = haversineKm(42.0, 21.43, 41.12, 20.8);
    expect(dist).toBeGreaterThan(100);
    expect(dist).toBeLessThan(130);
  });

  it("is commutative", () => {
    const a = haversineKm(42.0, 21.43, 41.12, 20.8);
    const b = haversineKm(41.12, 20.8, 42.0, 21.43);
    expect(a).toBeCloseTo(b, 5);
  });
});
