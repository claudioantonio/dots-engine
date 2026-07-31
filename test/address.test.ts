import { normalizePlayerId } from "../src/address";

describe("normalizePlayerId", () => {
  it("lowercases an EIP-55 checksummed address", () => {
    expect(normalizePlayerId("0xAbCdEf0123456789")).toBe("0xabcdef0123456789");
  });

  it("is idempotent on an already-lowercase address", () => {
    const lower = "0xabcdef0123456789";
    expect(normalizePlayerId(lower)).toBe(lower);
  });
});
