import crypto from "crypto";

import { poseidonStr } from "./crypto/hash";
import { unwrap } from "./errors";

/**
 * computeExternalNullifier return the external nullifier for the specified verification event.
 */
export function computeExternalNullifier(verificationEvent: string): bigint {
  return maskBits(unwrap(poseidonStr(verificationEvent)), 160);
}

/**
 * FileURI is either a wasm file URI or a wasm binary content
 * When running in browser, it is a wasm file URL, e.g. "https://localhost:8080/babyzk.wasm"
 * when running in node, it is a path.
 */
export type FileOrURI = Uint8Array | string;

/*
 * Encode a Uint8Array to a hex string.
 */
export function encodeToHex(src: Uint8Array): string {
  return (
    "0x" +
    Array.from(src)
      .map(byte => byte.toString(16).padStart(2, "0"))
      .join("")
  );
}

/*
 * Decode a hex string to a Uint8Array.
 */
export function decodeFromHex(s: string): Uint8Array {
  if (s.slice(0, 2) === "0x") {
    s = s.slice(2);
  }
  if (s.length % 2 !== 0) {
    throw new Error("Invalid hex string");
  }
  const bytes = new Uint8Array(s.length / 2);
  for (let i = 0; i < s.length; i += 2) {
    bytes[i / 2] = parseInt(s.substring(i, i + 2), 16);
  }
  return bytes;
}

/**
 * encodeToBase64 encodes a Uint8Array to a base64 string.
 * @param v Uint8Array value
 * @returns a base64 string
 */
export function encodeToBase64(v: Uint8Array): string {
  return Buffer.from(v).toString("base64");
}

/**
 * decodeFromBase64 decodes a base64 string to a Uint8Array.
 * @param s base64 string
 * @returns a Uint8Array value
 */
export function decodeFromBase64(s: string): Uint8Array {
  const buf = Buffer.from(s, "base64");
  return new Uint8Array(buf.buffer, buf.byteOffset, buf.length);
}

/**
 * JSONStringifyBigInts converts a JavaScript object or value to a JSON string,
 * with all BigInt values represented as strings.
 */
export function JSONStringifyBigInts(obj: unknown, space: number | string = 0, radix?: number): string {
  return JSON.stringify(obj, (_, v) => (typeof v === "bigint" ? v.toString(radix) : v), space);
}

/**
 * split256 splits a 256-bit bigint into two 128-bit bigints.
 */
export function split256(bigInt256: bigint): { msb: bigint; lsb: bigint } {
  // Mask to get the least significant 128 bits
  const lsbMask = BigInt(2 ** 128) - BigInt(1);
  const lsb: bigint = bigInt256 & lsbMask;
  const msb: bigint = bigInt256 >> BigInt(128);
  return { msb, lsb };
}

/**
 * maskBits masks the least significant bits of a bigint.
 */
export function maskBits(bigInt: bigint, bits: number): bigint {
  return bigInt & ((BigInt(1) << BigInt(bits)) - BigInt(1));
}

/**
 * sortedJSONString returns a sorted JSON string of an object.
 * @param obj object to be sorted
 * @returns a sorted JSON string
 */
export function sortedJSONString(obj: { [key: string]: unknown }): string {
  return JSON.stringify(
    Object.keys(obj)
      .sort()
      .reduce((acc: { [key: string]: unknown }, key) => {
        acc[key] = obj[key] as string;
        return acc;
      }, {})
  );
}

// crypto utils

/**
 * BN128 curve parameters: R
 */
export const bn128_R = 21888242871839275222246405745257275088548364400416034343698204186575808495617n;

/**
 * Generate a random Uint8Array of length n, using Node.js crypto.randomFillSync.
 */
export function genRandomBytes(n: number): Uint8Array {
  try {
    const array = new Uint8Array(n);
    if (globalThis && globalThis.crypto) {
      globalThis.crypto.getRandomValues(array);
    } else {
      crypto.randomFillSync(array);
    }
    return array;
  } catch (err) {
    throw new Error(`failed to get random bytes`, { cause: err });
  }
}

/**
 * Generate a random number in the range [0, bn128_R).
 * @returns a bigint, the random number.
 */
export const genRandomBN128 = (): bigint => {
  const buff = genRandomBytes(32);
  let result = BigInt(0);
  for (let i = 0; i < buff.length; i++) {
    result = (result << BigInt(8)) + BigInt(buff[i] as number);
  }
  result %= bn128_R;
  return result;
};

/**
 * URIs can be of different types: filepath, HTTP, or IPFS.
 */
export enum URIType {
  Filepath,
  HTTP,
  IPFS,
}

/**
 * Parse a URI to determine the type of URI.
 * @param _uri The URI to parse.
 * @returns the type of URI.
 */
export function parseURIType(_uri: string): URIType {
  const uri = _uri.trimStart();
  if (uri.startsWith("http://") || uri.startsWith("https://")) {
    return URIType.HTTP;
  }
  if (uri.startsWith("ipfs://")) {
    return URIType.IPFS;
  }
  return URIType.Filepath;
}

/**
 * Convert an IPFS link to an HTTP URL via a gateway.
 * @param ipfsLink The IPFS link.
 * @param gatewayBaseUrl The base URL of the IPFS gateway, default is pinata.cloud.
 */
export function ipfsToHttp(ipfsLink: string, gatewayBaseUrl = "https://gateway.pinata.cloud/ipfs/"): string {
  // Validate the IPFS link format
  if (!ipfsLink.startsWith("ipfs://")) {
    throw new Error("Invalid IPFS link. The link must start with 'ipfs://'.");
  }

  // Extract the content hash part by removing the "ipfs://" prefix and return the full HTTP URL
  return `${gatewayBaseUrl}${ipfsLink.substring(7)}`;
}

/**
 * Import node-fetch only if fetch is not available globally (Node.js environment)
 */
export const fetch =
  globalThis.fetch ||
  (async () => {
    const { default: nodeFetch } = await import("node-fetch");
    return nodeFetch;
  })();

/**
 * Fetch JSON data from a URL.
 */
export async function fetchBodyString(url: string): Promise<string> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.text();
}

/**
 * Fetch JSON data from a URL.
 */
export async function fetchJson<T>(url: string): Promise<T> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

/**
 * Fetch binary data from a URL.
 */
export async function fetchBinary(url: string): Promise<Uint8Array> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP error! Status: ${response.status}`);
  }
  const buffer = await response.arrayBuffer();
  return new Uint8Array(buffer);
}

/**
 * Load binary data from a file path.
 */
export async function loadBinary(path: string): Promise<Uint8Array> {
  const fs = await import("fs");
  if (fs === undefined) {
    throw new Error("Cannot load binary file in browser");
  }
  return fs.readFileSync(path);
}

/**
 * The current version of the protocol.
 */
export const CURRENT_VERSION = 1n;
