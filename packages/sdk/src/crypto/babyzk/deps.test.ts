import { describe, expect, it } from "vitest";
import { eddsa, newEdDSAPrivateKey, bn128FFToBigInt, bigintToBn128FF, poseidon, bn128, bn128_R, prepare } from "./deps";
import { decodeFromHex } from "../../utils";

// run prepare() before running the tests.
await prepare();

describe("ff and BigInter conversion", () => {
  it("conversion between bn128 field and bigint", async () => {
    const x = "0x999";
    const ff = bigintToBn128FF(x);
    expect(ff).toEqual(
      Uint8Array.from([
        59, 205, 255, 79, 72, 32, 39, 161, 244, 0, 80, 28, 116, 24, 176, 236, 117, 206, 52, 20, 67, 181, 156, 124, 229,
        153, 135, 3, 157, 49, 125, 43,
      ])
    );
    // convert back to bigint.
    expect(bn128FFToBigInt(ff)).toEqual(BigInt(x));
  });
  it("overflowed number conversion", async () => {
    const x = BigInt(bn128_R + 1n);
    const ff = bigintToBn128FF(x);
    const _x = bn128FFToBigInt(ff);
    expect(_x).toEqual(BigInt(1));
  });
});

describe("poseidon", () => {
  it("basic", async () => {
    const rv = poseidon([1, 2]);
    expect(rv).toEqual(BigInt("0x115cc0f5e7d690413df64c6b9662e9cf2a3617f2743245519e19607a4417189a"));
  });
});

describe("ffjavascript", () => {
  it("github issue 98", async () => {
    // There is a github issue in ffjavascript that the multiplication of two
    // large numbers returns incorrect result.
    // However, it seems that ffjavascript is working expectedly.
    // https://github.com/iden3/ffjavascript/issues/98
    const a = 5299619240641551281634865583518297030282874472190772894086521144482721001553n;
    const b = 16950150798460657717958625567821834550301663161624707787222815936182638968203n;
    const c = bn128().Fr.mul(bigintToBn128FF(a), bigintToBn128FF(b));
    expect(bn128FFToBigInt(c)).toEqual(19138581828712882593908706925461583697567205063300498062599267069621213248340n);
  });
});

describe("eddsa", () => {
  it("generate key pair from hex string", async () => {
    const sk = decodeFromHex("0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03");
    const pubkey = eddsa.prv2pub(sk);
    const [x, y] = pubkey;
    expect(x).toEqual(BigInt("0x182D8B0FE0AD17527524C4767F13209537505E6F894012E9B6A28818AEDDDA1A"));
    expect(y).toEqual(BigInt("0x2F6BD0D089F2F369541130E6647E8171425D4274CF912D6924EE45D704A9055A"));
  });

  it("generate key pair from random", async () => {
    const sk = newEdDSAPrivateKey();
    expect(sk.length).toEqual(32);
    const pubkey = eddsa.prv2pub(sk);
    expect(pubkey.length).toEqual(2);
  });

  it("sign", async () => {
    const sk = decodeFromHex("0xfd60ceb442aca7f74d2e56c1f0e93507798e8a6e02c4cd1a5585a36167fa7b03");
    const msg = BigInt("19797625955841268050359156414528652950728634709785852200585255929006079922028");
    const sig = eddsa.signPoseidon(sk, msg);
    expect(sig.R8.length).toEqual(2);
    expect(sig.R8[0]).toEqual(BigInt("4848490130789944528336104227640636253043945797344368699412661022325912302978"));
    expect(sig.R8[1]).toEqual(BigInt("20019521742277738954254690730812171222126574890528222445728228225961588737957"));
    expect(sig.S).toEqual(BigInt("2087183375511321068484080227099016439761394610791849446634143832933017432681"));
    // verification should work
    expect(eddsa.verifyPoseidon(msg, sig, eddsa.prv2pub(sk))).toEqual(true);
    // verification should fail if we change the message
    expect(eddsa.verifyPoseidon(msg + BigInt(1), sig, eddsa.prv2pub(sk))).toEqual(false);
  });
});
