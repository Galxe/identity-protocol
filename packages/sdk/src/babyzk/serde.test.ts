import { describe, expect, it } from "vitest";
import { pubKeySerde } from "./serde";

import type { EdDSAPubKey as PubKey } from "@/crypto/babyzk/deps";

describe("pubKeySerde", () => {
  it("serialize and deserialize", async () => {
    const testcases: PubKey[] = [
      [1n, 0n],
      [0n, 1n],
      [(1n << 256n) - 1n, 0n],
      [0n, (1n << 256n) - 1n],
      [BigInt("0x123456789abcdef"), BigInt("0xdeadbeefcafe")],
    ];
    testcases.forEach(pubkey => {
      const v = pubKeySerde.serialize(pubkey);
      expect(pubKeySerde.deserialize(v)).toEqual(pubkey);
    });
  });
});
