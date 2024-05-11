import type { EdDSAPubKey as PubKey } from "@/crypto/babyzk/deps";

const wordSize = 32; // 32 bytes, 256 bits
const totalBytes = wordSize * 2; // 64 bytes in total

export const pubKeySerde = {
  serialize(pubkey: PubKey): Uint8Array {
    // babyzk public key is a pair of two 256-bit bigints
    // convert them into Uint8Array for serialization
    const result = new Uint8Array(totalBytes);
    pubkey.forEach((v, index) => {
      for (let i = 0; i < wordSize; i++) {
        const byte = Number((v >> BigInt(8 * i)) & BigInt(0xff));
        result[index * wordSize + i] = byte;
      }
    });

    return result;
  },

  deserialize(v: Uint8Array): PubKey {
    if (v.length !== totalBytes) {
      throw new Error(`invalid pubkey length: ${v.length}`);
    }
    // convert Uint8Array back to two 256-bit bigints
    const pubkey: PubKey = [BigInt(0), BigInt(0)];
    for (let wordIndex = 0; wordIndex < 2; wordIndex++) {
      let val = BigInt(0);
      for (let byteIndex = 0; byteIndex < wordSize; byteIndex++) {
        const byteValue = BigInt(v[wordIndex * wordSize + byteIndex] as number);
        val |= byteValue << BigInt(8 * byteIndex);
      }
      pubkey[wordIndex] = val;
    }
    return pubkey;
  },
};
