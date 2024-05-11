import { poseidon } from "@/crypto/babyzk/deps";

/**
 * Generate identity commitment from secret and nullifier.
 * @param secret The identity secret.
 * @param nullifier The internal nullifier.
 * @returns The identity commitment.
 *
 */
export function genIdentityCommitment(secret: bigint, nullifier: bigint): bigint {
  return poseidon([secret, nullifier]);
}
