import { describe, expect, it } from "vitest";
import { poseidonStr, keccak256Str, poseidonBigInts } from "./hash";
import { unwrap } from "../errors";
import { prepare } from "./babyzk/deps";

//@ts-expect-error WIP incorrect test ts setup, Top-level await is actually supported during tests.
await prepare();

describe("poseidon hash", () => {
  it("str hash should work", async () => {
    const rv = poseidonStr("galxe");
    expect(unwrap(rv)).toEqual(BigInt("16441516414138281111511708822423436941222186864915412128389244822471142363020"));
    const rv2 = poseidonStr("something else");
    expect(unwrap(rv2)).toEqual(912632466895999857193368657908206597634855146678206719550819928009616095778n);
  });

  it("str hash should fail on empty string", async () => {
    const rv = poseidonStr("");
    expect(rv.ok).toBe(false);
  });

  it("poseidonBigInts should work", async () => {
    const rv = poseidonBigInts([BigInt(1), BigInt(2), BigInt(3)]);
    expect(rv).toEqual(6542985608222806190361240322586112750744169038454362455181422643027100751666n);
  });
});

describe("keccak256", () => {
  it("str hash", async () => {
    const rv = keccak256Str("galxe");
    expect(unwrap(rv)).toEqual(BigInt("0x336444b6556289a65acdb1507ad31ee24aafc810e6259fe606fd31971087bc42"));
  });
});
