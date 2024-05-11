import { keccak256 } from "js-sha3";

import { poseidon, BigInter } from "@/crypto/babyzk/deps";
import { Result, Err, Ok, encase } from "@/errors";

const spongeChunkSize = 31;
const spongeInputs = 16;

// TODO: interesting bug, if use poseidonBigInts = poseidon, it will be undefined.
/**
 * Poseidon hash function for bigints.
 * Re-exported from babyzk/deps.ts.
 * @param inputs - an array of BigInt, each BigInt is a field element.
 * @returns a bigint, hash value, the field element.
 */
export const poseidonBigInts = (inputs: BigInter[]): bigint => poseidon(inputs);

/**
 * Poseidon hash function for strings.
 * @param msg - a string.
 * @returns a bigint, hash value, the field element.
 *
 */
export function poseidonStr(msg: string): Result<bigint> {
  return poseidonBytes(new TextEncoder().encode(msg));
}

function poseidonBytes(msg: Uint8Array): Result<bigint> {
  return poseidonBytesX(msg, spongeInputs);
}

function poseidonBytesX(msg: Uint8Array, frameSize: number): Result<bigint> {
  if (frameSize < 2 || frameSize > 16) {
    return Err(new Error("incorrect frame size"));
  }

  if (msg.length === 0) {
    return Err(new Error("empty message"));
  }

  const poseidonHash = encase(poseidonBigInts);

  // not used inputs default to zero
  const inputs: bigint[] = Array.from({ length: frameSize }, () => BigInt(0));
  let dirty = false;
  let hash: bigint | null = null;

  let k = 0;
  for (let i = 0; i < Math.floor(msg.length / spongeChunkSize); i++) {
    dirty = true;
    inputs[k] = bytesBEtoBigInt(msg.slice(spongeChunkSize * i, spongeChunkSize * (i + 1)));
    if (k === frameSize - 1) {
      dirty = false;
      const hashResult = poseidonHash(inputs);
      if (!hashResult.ok) {
        return hashResult;
      }
      inputs.fill(BigInt(0));
      hash = hashResult.value;
      inputs[0] = hash;
      k = 1;
    } else {
      k++;
    }
  }

  if (msg.length % spongeChunkSize !== 0) {
    // the last chunk of the message is less than 31 bytes
    const buf = new Uint8Array(spongeChunkSize).fill(0);
    buf.set(msg.slice(Math.floor(msg.length / spongeChunkSize) * spongeChunkSize));
    inputs[k] = bytesBEtoBigInt(buf);
    dirty = true;
  }

  if (dirty) {
    const hashResult = poseidonHash(inputs);
    if (!hashResult.ok) {
      return hashResult;
    }
    hash = hashResult.value;
  }

  return Ok(hash as bigint);
}

/**
 * Keccak256 hash function for strings.
 * @param msg - a string.
 * @returns a bigint, uint256 hash result.
 */
export const keccak256Str = (s: string): Result<bigint> => {
  return Ok(BigInt("0x" + keccak256(s)));
};

const bytesBEtoBigInt = (bytes: Uint8Array): bigint => {
  let rv = BigInt(0);
  for (let i = 0; i < bytes.length; i++) {
    rv <<= BigInt(8);
    rv |= BigInt(bytes[i] as number);
  }
  return rv;
};
