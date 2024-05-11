import {
  buildPoseidon,
  buildEddsa,
  EdDSA as RawEdDSA,
  EdDSASig as RawSig,
  Point as RawPoint,
  PoseidonHash,
} from "circomlibjs";
import { getCurveFromName, Curve } from "ffjavascript";
import { groth16 as _groth16 } from "snarkjs";
// somehow the following import is not working.
// dependencies build will fail...
// have to copy the type definition here.
// import type { WholeProof as _WholeProof, Proof as _Proof, VKey as _VKey } from "snarkjs";

import { FileOrURI, genRandomBytes, bn128_R } from "@/utils";

export { bn128_R };

export type Proof = {
  pi_a: [string, string, string];
  pi_b: [[string, string], [string, string], [string, string]];
  pi_c: [string, string, string];
  protocol: string;
  curve: string;
};

export type WholeProof = {
  proof: Proof;
  publicSignals: string[];
};

export interface VKey {
  protocol: string;
  curve: string;
  nPublic: number;
  vk_alpha_1: string[];
  vk_beta_2: string[][];
  vk_gamma_2: string[][];
  vk_delta_2: string[][];
  vk_alphabeta_12?: string[][][];
  IC: string[][];
}

export type BigInter = bigint | number | string;
export type BigInterArray = BigInter[];
export type RawFF = Uint8Array;
export type Point = [bigint, bigint];
export type PoseidonHashType = (inputs: BigInterArray, initState?: BigInter, nOut?: number) => bigint;
export type EdDSASig = { R8: Point; S: bigint };
/**
 * EdDSA private key, represented as a Uint8Array.
 */
export type EdDSAPrivKey = Uint8Array;
/**
 * EdDSA public key, represented as a Point.
 */
export type EdDSAPubKey = Point;

export interface BabyZKCircuitInput {
  [key: string]: bigint | bigint[];
}

let _bn128: null | Curve = null;
let _poseidon: null | PoseidonHash = null;
let _eddsa: null | RawEdDSA = null;

function getEddsa(): RawEdDSA {
  if (_eddsa === null) {
    throw new Error(`eddsa not prepared`);
  }
  return _eddsa;
}

function getPoseidon(): PoseidonHash {
  if (_poseidon === null) {
    throw new Error(`poseidon hash not prepared`);
  }
  return _poseidon;
}

/**
 * Return the bn128 curve, throw an error if the curve is not prepared.
 * @returns the bn128 curve.
 */
export function bn128(): Curve {
  if (_bn128 === null) {
    throw new Error(`bn128 curve not prepared`);
  }
  return _bn128;
}

/**
 * Prepare the crypto library. This function must be called before any other
 * functions in this module.
 */
export const prepare = async () => {
  if (_bn128 === null) {
    // TODO: test it out when singleThread = false.
    _bn128 = await getCurveFromName("bn128", true);
  }
  if (_poseidon === null) {
    _poseidon = await buildPoseidon();
  }
  if (_eddsa === null) {
    _eddsa = await buildEddsa();
  }
};

/**
 * Check if the crypto library is prepared.
 * @returns true if the crypto library is prepared, false otherwise.
 */
export const isPrepared = () => {
  return _bn128 !== null && _poseidon !== null && _eddsa !== null;
};

/**
 * Convert the Montgomery representation of a bn128 finite field element to a
 * bigint. Common use cases are: poseidon hash outputs, eddsa pubkey point.
 *
 * @returns a bigint representation of a bn128 finite field element.
 *
 */
export function bn128FFToBigInt(x: RawFF): bigint {
  return BigInt(bn128().Fr.toString(x));
}

/**
 * Convert a bigint to the Montgomery representation of a bn128 finite field
 * element.
 */
export function bigintToBn128FF(x: BigInter): RawFF {
  return bn128().Fr.e(x);
}

/**
 * Convert a Point of [bigint, bigint] to Montgomery style [Uint8Array, Uint8Array].
 * not exported.
 */
const pointToRawPoint = (p: Point): RawPoint => {
  return [bigintToBn128FF(p[0]), bigintToBn128FF(p[1])];
};

/**
 * Convert a Point of [bigint, bigint] to Montgomery style [Uint8Array, Uint8Array].
 * not exported.
 */
const rawPointToPoint = (p: RawPoint): Point => {
  return [bn128FFToBigInt(p[0]), bn128FFToBigInt(p[1])];
};

/**
 * Poseidon hash function.
 *
 * @param inputs - an array of BigInt, each BigInt is a field element.
 * @param initState - an optional BigInt, the initial state of the hash function.
 * @param nOut - an optional number, the number of output elements.
 * @returns a bigint, hash value, the field element.
 */
export const poseidon: PoseidonHashType = (inputs: BigInterArray, initState?: BigInter, nOut?: number) => {
  if (inputs.length == 0 || inputs.length > 16) {
    throw new Error(`poseidon hash: invalid inputs length, must be between 1 and 16, but got ${inputs.length}`);
  }
  const ff = getPoseidon()(inputs, initState, nOut);
  return bn128FFToBigInt(ff);
};

/**
 * EdDSA signature schema. This is a wrapper of circomlibjs' EdDSA class.
 * so that all inputs and outputs are fields in bigint,
 * instead of mixed of Montgomery and bigint.
 */
export const eddsa = {
  prv2pub: (prv: EdDSAPrivKey): Point => {
    const pub = getEddsa().prv2pub(prv);
    return [bn128FFToBigInt(pub[0]), bn128FFToBigInt(pub[1])];
  },

  signPoseidon: (prv: EdDSAPrivKey, msg: BigInter): EdDSASig => {
    const rawMsg = bigintToBn128FF(msg);
    const rv = getEddsa().signPoseidon(prv, rawMsg);
    return {
      R8: rawPointToPoint(rv.R8),
      S: rv.S,
    };
  },

  verifyPoseidon: (msg: BigInter, sig: EdDSASig, pubKey: Point): boolean => {
    const rawMsg = bigintToBn128FF(msg);
    const rawSig: RawSig = {
      R8: pointToRawPoint(sig.R8),
      S: sig.S,
    };
    return getEddsa().verifyPoseidon(rawMsg, rawSig, pointToRawPoint(pubKey));
  },

  packSignature: (sig: EdDSASig): Uint8Array => {
    return getEddsa().packSignature({ R8: pointToRawPoint(sig.R8), S: sig.S });
  },

  unpackSignature: (sigBuff: Uint8Array): EdDSASig => {
    const rawSig = getEddsa().unpackSignature(sigBuff);
    return {
      R8: rawPointToPoint(rawSig.R8),
      S: rawSig.S,
    };
  },
};

/**
 * Generate a new EdDSA private key.
 *
 * @returns a Uint8Array of length 32.
 *
 * @example
 * ```
 * import { newEdDSAPrivateKey } from "@/crypto/deps";
 * const sk = newEdDSAPrivateKey();
 * ```
 *
 */
export const newEdDSAPrivateKey = (): EdDSAPrivKey => {
  return genRandomBytes(32);
};

/**
 * groth16 is a zkSNARK proof system.
 */
export const groth16 = {
  genProof: async (witnessGenWasm: FileOrURI, zkey: FileOrURI, input: BabyZKCircuitInput): Promise<WholeProof> => {
    return await _groth16.fullProve(input, witnessGenWasm, zkey);
  },

  verify: async (vkey: VKey, proof: WholeProof): Promise<boolean> => {
    return await _groth16.verify(vkey, proof.publicSignals, proof.proof);
  },
};
